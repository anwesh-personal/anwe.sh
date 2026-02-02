/**
 * Leads API Endpoint
 * Create and manage leads with AI scoring
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// AI Lead Scoring based on behavior signals
async function calculateLeadScore(data: {
    email: string;
    name?: string;
    company?: string;
    sessionId?: string;
}): Promise<{ score: number; reasons: string[]; classification: string }> {
    const reasons: string[] = [];
    let score = 50; // Base score

    // Email domain analysis
    const emailDomain = data.email.split('@')[1]?.toLowerCase() || '';

    // Enterprise domains get higher scores
    const enterpriseDomains = ['google.com', 'microsoft.com', 'amazon.com', 'apple.com', 'meta.com', 'nvidia.com'];
    const businessDomains = ['.co', '.io', '.ai', '.tech', '.dev'];
    const freeEmailDomains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'icloud.com'];

    if (enterpriseDomains.includes(emailDomain)) {
        score += 30;
        reasons.push('Enterprise email domain');
    } else if (businessDomains.some(d => emailDomain.endsWith(d))) {
        score += 20;
        reasons.push('Business email domain');
    } else if (!freeEmailDomains.includes(emailDomain)) {
        score += 15;
        reasons.push('Custom email domain');
    } else {
        reasons.push('Free email domain');
    }

    // Name provided
    if (data.name && data.name.trim().length > 0) {
        score += 10;
        reasons.push('Name provided');
    }

    // Company provided
    if (data.company && data.company.trim().length > 0) {
        score += 15;
        reasons.push('Company provided');
    }

    // Session behavior analysis
    if (data.sessionId) {
        const { data: session } = await supabase
            .from('sessions')
            .select('*')
            .eq('session_id', data.sessionId)
            .single();

        if (session) {
            // High engagement (multiple pages)
            if (session.page_count >= 5) {
                score += 15;
                reasons.push('High page engagement (5+ pages)');
            } else if (session.page_count >= 3) {
                score += 10;
                reasons.push('Good page engagement (3+ pages)');
            }

            // Time on site
            if (session.duration_seconds >= 300) {
                score += 10;
                reasons.push('Long session duration (5+ min)');
            } else if (session.duration_seconds >= 120) {
                score += 5;
                reasons.push('Good session duration (2+ min)');
            }

            // Scroll depth
            if (session.max_scroll_depth >= 75) {
                score += 10;
                reasons.push('High scroll engagement (75%+)');
            }

            // Rage clicks (negative signal)
            if (session.rage_click_count > 0) {
                score -= 5;
                reasons.push('Potential frustration (rage clicks detected)');
            }
        }
    }

    // Cap score at 100
    score = Math.min(100, Math.max(0, score));

    // Classification based on score
    let classification = 'cold';
    if (score >= 80) {
        classification = 'hot';
    } else if (score >= 60) {
        classification = 'warm';
    } else if (score >= 40) {
        classification = 'cold';
    } else {
        classification = 'cold';
    }

    return { score, reasons, classification };
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const {
            email,
            name,
            company,
            phone,
            source,
            sourcePage,
            sessionId,
            referrer,
            utmSource,
            utmMedium,
            utmCampaign
        } = body;

        if (!email) {
            return NextResponse.json({ error: 'Email is required' }, { status: 400 });
        }

        // Check for existing lead
        const { data: existingLead } = await supabase
            .from('leads')
            .select('id')
            .eq('email', email.toLowerCase())
            .single();

        if (existingLead) {
            // Update existing lead with new session info
            await supabase
                .from('leads')
                .update({
                    session_id: sessionId,
                    source_page: sourcePage,
                    updated_at: new Date().toISOString()
                })
                .eq('id', existingLead.id);

            return NextResponse.json({
                success: true,
                lead: existingLead,
                message: 'Lead already exists - updated session'
            });
        }

        // Calculate AI score
        const { score, reasons, classification } = await calculateLeadScore({
            email,
            name,
            company,
            sessionId
        });

        // Get session data for behavior signals
        let behaviorData = {
            pagesViewed: 1,
            timeOnSite: 0,
            scrollDepthAvg: 0
        };

        if (sessionId) {
            const { data: session } = await supabase
                .from('sessions')
                .select('page_count, duration_seconds, max_scroll_depth')
                .eq('session_id', sessionId)
                .single();

            if (session) {
                behaviorData = {
                    pagesViewed: session.page_count || 1,
                    timeOnSite: session.duration_seconds || 0,
                    scrollDepthAvg: session.max_scroll_depth || 0
                };
            }
        }

        // Create lead
        const { data: lead, error } = await supabase
            .from('leads')
            .insert([{
                email: email.toLowerCase(),
                name: name || null,
                company: company || null,
                phone: phone || null,
                source: source || 'website',
                source_page: sourcePage,
                session_id: sessionId,
                referrer: referrer || null,
                utm_source: utmSource || null,
                utm_medium: utmMedium || null,
                utm_campaign: utmCampaign || null,
                ai_score: score,
                ai_score_reasons: reasons,
                ai_classification: classification,
                pages_viewed: behaviorData.pagesViewed,
                time_on_site_seconds: behaviorData.timeOnSite,
                scroll_depth_avg: behaviorData.scrollDepthAvg,
                status: 'new'
            }])
            .select()
            .single();

        if (error) {
            console.error('Error creating lead:', error);
            return NextResponse.json({ error: 'Failed to create lead' }, { status: 500 });
        }

        // Mark session as converted
        if (sessionId) {
            await supabase
                .from('sessions')
                .update({
                    converted: true,
                    conversion_type: 'lead_capture'
                })
                .eq('session_id', sessionId);
        }

        return NextResponse.json({
            success: true,
            lead: {
                id: lead.id,
                email: lead.email,
                score,
                classification
            }
        });

    } catch (error) {
        console.error('Lead API error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

// Get leads (admin only - TODO: add auth)
export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    const status = searchParams.get('status');
    const classification = searchParams.get('classification');

    let query = supabase
        .from('leads')
        .select('*')
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

    if (status) {
        query = query.eq('status', status);
    }
    if (classification) {
        query = query.eq('ai_classification', classification);
    }

    const { data, error } = await query;

    if (error) {
        return NextResponse.json({ error: 'Failed to fetch leads' }, { status: 500 });
    }

    return NextResponse.json({ leads: data });
}
