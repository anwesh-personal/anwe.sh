/**
 * Form Parser
 * Parse embedded HTML/JS forms and extract field structure
 */

// =====================================================
// TYPES
// =====================================================

export interface ParsedFormField {
    name: string;
    type: 'text' | 'email' | 'tel' | 'hidden' | 'select' | 'textarea' | 'checkbox' | 'radio' | 'number';
    label?: string;
    placeholder?: string;
    required: boolean;
    value?: string;
    options?: { value: string; label: string }[]; // For select/radio
}

export interface ParsedForm {
    success: boolean;
    action: string;
    method: 'GET' | 'POST';
    fields: ParsedFormField[];
    hiddenFields: Record<string, string>;
    submitButtonText: string;
    formId?: string;
    formClass?: string;
    rawHtml: string;
    error?: string;
}

// =====================================================
// FORM PATTERNS FOR COMMON PROVIDERS
// =====================================================

const PROVIDER_PATTERNS = {
    mailchimp: {
        // Mailchimp forms have action like https://xyz.us14.list-manage.com/subscribe/post
        actionPattern: /list-manage\.com/i,
        emailField: 'EMAIL',
        nameFields: ['FNAME', 'LNAME', 'NAME'],
    },
    convertkit: {
        // ConvertKit forms have action like https://app.convertkit.com/forms/12345/subscriptions
        actionPattern: /convertkit\.com/i,
        emailField: 'email_address',
        nameFields: ['first_name', 'fields[first_name]'],
    },
    aweber: {
        actionPattern: /aweber\.com/i,
        emailField: 'email',
        nameFields: ['name'],
    },
    getresponse: {
        actionPattern: /getresponse\.com/i,
        emailField: 'email',
        nameFields: ['name', 'first_name'],
    },
    activecampaign: {
        actionPattern: /activehosted\.com/i,
        emailField: 'email',
        nameFields: ['fullname', 'first_name'],
    },
};

// =====================================================
// PARSING FUNCTIONS
// =====================================================

/**
 * Extract form action URL from HTML
 */
function extractFormAction(html: string): { action: string; method: 'GET' | 'POST' } {
    // Try to find form tag with action
    const formMatch = html.match(/<form[^>]*action=["']([^"']+)["'][^>]*>/i);
    let action = formMatch?.[1] || '';

    // Extract method
    const methodMatch = html.match(/<form[^>]*method=["']([^"']+)["'][^>]*>/i);
    const method = (methodMatch?.[1]?.toUpperCase() === 'GET' ? 'GET' : 'POST');

    // If no form action, try to find it in JavaScript
    if (!action) {
        // Look for fetch/ajax calls
        const fetchMatch = html.match(/fetch\s*\(\s*["']([^"']+)["']/i);
        if (fetchMatch) action = fetchMatch[1];

        // Look for jQuery ajax
        const ajaxMatch = html.match(/\$\.(?:ajax|post|get)\s*\(\s*["']([^"']+)["']/i);
        if (ajaxMatch) action = ajaxMatch[1];

        // Look for XMLHttpRequest
        const xhrMatch = html.match(/\.open\s*\(\s*["'][^"']+["']\s*,\s*["']([^"']+)["']/i);
        if (xhrMatch) action = xhrMatch[1];
    }

    // Handle relative URLs
    if (action && !action.startsWith('http') && !action.startsWith('//')) {
        // Keep as-is, will need base URL when submitting
    }

    return { action, method };
}

/**
 * Extract input fields from HTML
 */
function extractInputFields(html: string): ParsedFormField[] {
    const fields: ParsedFormField[] = [];
    const processedNames = new Set<string>();

    // Match input tags
    const inputRegex = /<input[^>]*>/gi;
    let match;

    while ((match = inputRegex.exec(html)) !== null) {
        const inputHtml = match[0];

        // Extract attributes
        const type = (inputHtml.match(/type=["']([^"']+)["']/i)?.[1] || 'text').toLowerCase();
        const name = inputHtml.match(/name=["']([^"']+)["']/i)?.[1];
        const placeholder = inputHtml.match(/placeholder=["']([^"']+)["']/i)?.[1];
        const value = inputHtml.match(/value=["']([^"']+)["']/i)?.[1];
        const required = /required(?:=["'](?:true|required)["'])?/i.test(inputHtml);
        const id = inputHtml.match(/id=["']([^"']+)["']/i)?.[1];

        if (!name || processedNames.has(name)) continue;
        processedNames.add(name);

        // Skip submit buttons and hidden fields (handle separately)
        if (type === 'submit' || type === 'button' || type === 'image') continue;

        // Find associated label
        let label: string | undefined;
        if (id) {
            const labelMatch = html.match(new RegExp(`<label[^>]*for=["']${id}["'][^>]*>([^<]+)</label>`, 'i'));
            label = labelMatch?.[1]?.trim();
        }

        if (!label) {
            // Try to find label before input
            const beforeInput = html.substring(0, match.index);
            const lastLabelMatch = beforeInput.match(/<label[^>]*>([^<]+)<\/label>\s*$/i);
            label = lastLabelMatch?.[1]?.trim();
        }

        fields.push({
            name,
            type: type as ParsedFormField['type'],
            label,
            placeholder,
            required,
            value: type === 'hidden' ? value : undefined,
        });
    }

    // Match textarea tags
    const textareaRegex = /<textarea[^>]*name=["']([^"']+)["'][^>]*>([^<]*)<\/textarea>/gi;
    while ((match = textareaRegex.exec(html)) !== null) {
        const name = match[1];
        if (processedNames.has(name)) continue;
        processedNames.add(name);

        const textareaHtml = match[0];
        const placeholder = textareaHtml.match(/placeholder=["']([^"']+)["']/i)?.[1];
        const required = /required/i.test(textareaHtml);

        fields.push({
            name,
            type: 'textarea',
            placeholder,
            required,
        });
    }

    // Match select tags
    const selectRegex = /<select[^>]*name=["']([^"']+)["'][^>]*>([\s\S]*?)<\/select>/gi;
    while ((match = selectRegex.exec(html)) !== null) {
        const name = match[1];
        if (processedNames.has(name)) continue;
        processedNames.add(name);

        const selectHtml = match[0];
        const optionsHtml = match[2];
        const required = /required/i.test(selectHtml);

        // Extract options
        const options: { value: string; label: string }[] = [];
        const optionRegex = /<option[^>]*value=["']([^"']*)["'][^>]*>([^<]*)<\/option>/gi;
        let optionMatch;
        while ((optionMatch = optionRegex.exec(optionsHtml)) !== null) {
            options.push({
                value: optionMatch[1],
                label: optionMatch[2].trim(),
            });
        }

        fields.push({
            name,
            type: 'select',
            required,
            options,
        });
    }

    return fields;
}

/**
 * Extract hidden fields (for form submission)
 */
function extractHiddenFields(html: string): Record<string, string> {
    const hidden: Record<string, string> = {};

    const hiddenRegex = /<input[^>]*type=["']hidden["'][^>]*>/gi;
    let match;

    while ((match = hiddenRegex.exec(html)) !== null) {
        const inputHtml = match[0];
        const name = inputHtml.match(/name=["']([^"']+)["']/i)?.[1];
        const value = inputHtml.match(/value=["']([^"']*)["']/i)?.[1] || '';

        if (name) {
            hidden[name] = value;
        }
    }

    return hidden;
}

/**
 * Extract submit button text
 */
function extractSubmitButton(html: string): string {
    // Check input submit
    const submitInput = html.match(/<input[^>]*type=["']submit["'][^>]*value=["']([^"']+)["'][^>]*>/i);
    if (submitInput) return submitInput[1];

    // Check button tag
    const buttonTag = html.match(/<button[^>]*type=["']submit["'][^>]*>([^<]+)<\/button>/i);
    if (buttonTag) return buttonTag[1].trim();

    // Check any button
    const anyButton = html.match(/<button[^>]*>([^<]+)<\/button>/i);
    if (anyButton) return anyButton[1].trim();

    return 'Subscribe';
}

/**
 * Detect provider from form content
 */
export function detectProvider(html: string): string | null {
    for (const [provider, config] of Object.entries(PROVIDER_PATTERNS)) {
        if (config.actionPattern.test(html)) {
            return provider;
        }
    }
    return null;
}

/**
 * Parse embedded form HTML
 */
export function parseFormHtml(html: string): ParsedForm {
    try {
        // Clean up HTML
        const cleanHtml = html.trim();

        if (!cleanHtml) {
            return {
                success: false,
                action: '',
                method: 'POST',
                fields: [],
                hiddenFields: {},
                submitButtonText: 'Subscribe',
                rawHtml: html,
                error: 'Empty form content',
            };
        }

        // Extract form details
        const { action, method } = extractFormAction(cleanHtml);
        const allFields = extractInputFields(cleanHtml);
        const hiddenFields = extractHiddenFields(cleanHtml);
        const submitButtonText = extractSubmitButton(cleanHtml);

        // Separate visible and hidden fields
        const visibleFields = allFields.filter(f => f.type !== 'hidden');

        // Extract form ID and class
        const formIdMatch = cleanHtml.match(/<form[^>]*id=["']([^"']+)["']/i);
        const formClassMatch = cleanHtml.match(/<form[^>]*class=["']([^"']+)["']/i);

        return {
            success: true,
            action,
            method,
            fields: visibleFields,
            hiddenFields,
            submitButtonText,
            formId: formIdMatch?.[1],
            formClass: formClassMatch?.[1],
            rawHtml: html,
        };

    } catch (error) {
        return {
            success: false,
            action: '',
            method: 'POST',
            fields: [],
            hiddenFields: {},
            submitButtonText: 'Subscribe',
            rawHtml: html,
            error: error instanceof Error ? error.message : 'Failed to parse form',
        };
    }
}

/**
 * Sanitize form HTML for safe rendering
 */
export function sanitizeFormHtml(html: string): string {
    // Remove script tags (but preserve inline event handlers for original mode)
    let sanitized = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');

    // Remove onclick handlers that might be XSS
    sanitized = sanitized.replace(/on\w+\s*=\s*["'][^"']*["']/gi, '');

    // Remove javascript: URLs
    sanitized = sanitized.replace(/href\s*=\s*["']javascript:[^"']*["']/gi, 'href="#"');

    return sanitized;
}

/**
 * Generate styled form HTML from parsed fields
 */
export function generateStyledForm(
    parsed: ParsedForm,
    options: {
        formId?: string;
        className?: string;
        buttonClassName?: string;
        inputClassName?: string;
        showLabels?: boolean;
    } = {}
): string {
    const {
        formId = 'styled-form',
        className = 'styled-form',
        buttonClassName = 'btn-primary',
        inputClassName = 'form-input',
        showLabels = true,
    } = options;

    let html = `<form id="${formId}" class="${className}" action="${parsed.action}" method="${parsed.method}">`;

    // Add visible fields
    for (const field of parsed.fields) {
        html += '<div class="form-group">';

        if (showLabels && field.label) {
            html += `<label for="${field.name}">${field.label}${field.required ? ' *' : ''}</label>`;
        }

        if (field.type === 'textarea') {
            html += `<textarea 
                id="${field.name}"
                name="${field.name}" 
                class="${inputClassName}"
                placeholder="${field.placeholder || ''}"
                ${field.required ? 'required' : ''}
            ></textarea>`;
        } else if (field.type === 'select' && field.options) {
            html += `<select id="${field.name}" name="${field.name}" class="${inputClassName}" ${field.required ? 'required' : ''}>`;
            for (const opt of field.options) {
                html += `<option value="${opt.value}">${opt.label}</option>`;
            }
            html += '</select>';
        } else {
            html += `<input 
                type="${field.type}"
                id="${field.name}"
                name="${field.name}" 
                class="${inputClassName}"
                placeholder="${field.placeholder || field.label || ''}"
                ${field.required ? 'required' : ''}
            />`;
        }

        html += '</div>';
    }

    // Add hidden fields
    for (const [name, value] of Object.entries(parsed.hiddenFields)) {
        html += `<input type="hidden" name="${name}" value="${value}" />`;
    }

    // Add submit button
    html += `<button type="submit" class="${buttonClassName}">${parsed.submitButtonText}</button>`;

    html += '</form>';

    return html;
}
