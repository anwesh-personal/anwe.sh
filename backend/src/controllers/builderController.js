/**
 * Builder Controller
 * Handles template generation from configuration
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import archiver from 'archiver';
import { pipeline } from 'stream/promises';
import { promisify } from 'util';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const generateTemplate = async (req, res) => {
  try {
    const config = req.body;

    if (!config || !config.projectName) {
      return res.status(400).json({ error: 'Configuration is required' });
    }

    // Create temp directory for template
    const tempDir = path.join(__dirname, '../../temp', `template-${Date.now()}`);
    fs.mkdirSync(tempDir, { recursive: true });

    // Copy base template structure
    const templateBase = path.join(__dirname, '../../../');
    await copyDirectory(templateBase, tempDir, config);

    // Create config.json
    fs.writeFileSync(
      path.join(tempDir, 'config.json'),
      JSON.stringify(config, null, 2)
    );

    // Create ZIP archive
    const zipPath = path.join(tempDir, `${config.projectName || 'saas-template'}.zip`);
    await createZip(tempDir, zipPath, config.projectName || 'saas-template');

    // Send ZIP file
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="${config.projectName || 'saas-template'}.zip"`);
    
    const fileStream = fs.createReadStream(zipPath);
    await pipeline(fileStream, res);

    // Cleanup
    fs.rmSync(tempDir, { recursive: true, force: true });

  } catch (error) {
    console.error('Template generation error:', error);
    res.status(500).json({ error: error.message || 'Failed to generate template' });
  }
};

async function copyDirectory(src, dest, config) {
  const entries = fs.readdirSync(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    // Skip certain directories/files
    if (['node_modules', '.git', 'temp', 'dist', '.env'].includes(entry.name)) {
      continue;
    }

    if (entry.isDirectory()) {
      fs.mkdirSync(destPath, { recursive: true });
      await copyDirectory(srcPath, destPath, config);
    } else {
      // Apply config transformations to files
      let content = fs.readFileSync(srcPath, 'utf8');
      
      // Replace placeholders with config values
      if (config.projectName) {
        content = content.replace(/Vanilla SaaS/g, config.projectName);
        content = content.replace(/vanilla-saas/g, config.projectName.toLowerCase().replace(/\s+/g, '-'));
      }

      fs.writeFileSync(destPath, content);
    }
  }
}

async function createZip(sourceDir, zipPath, projectName) {
  return new Promise((resolve, reject) => {
    const output = fs.createWriteStream(zipPath);
    const archive = archiver('zip', { zlib: { level: 9 } });

    output.on('close', () => {
      console.log(`Archive created: ${archive.pointer()} total bytes`);
      resolve();
    });
    
    archive.on('error', (err) => {
      console.error('Archive error:', err);
      reject(err);
    });

    archive.on('warning', (err) => {
      if (err.code === 'ENOENT') {
        console.warn('Archive warning:', err);
      } else {
        reject(err);
      }
    });

    archive.pipe(output);
    
    // Add all files from source directory
    archive.directory(sourceDir, false);
    
    archive.finalize();
  });
}
