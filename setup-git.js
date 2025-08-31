#!/usr/bin/env node

// Git Setup and Backup System for Production
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

class GitManager {
  constructor(projectPath = '.') {
    this.projectPath = path.resolve(projectPath);
    this.backupBranch = 'production-backup';
  }

  // Initialize Git repository if not exists
  initializeGit() {
    try {
      console.log('🔧 Initializing Git repository...');
      
      // Check if git repo exists
      try {
        execSync('git status', { cwd: this.projectPath, stdio: 'ignore' });
        console.log('✅ Git repository already exists');
      } catch {
        // Initialize git repo
        execSync('git init', { cwd: this.projectPath });
        console.log('✅ Git repository initialized');
      }
      
      // Create .gitignore
      const gitignoreContent = `
# Dependencies
node_modules/
npm-debug.log*
package-lock.json

# Environment variables
.env
.env.local
.env.production

# Logs
logs/
*.log

# Runtime data
pids/
*.pid
*.seed

# Build outputs
build/
dist/
.tmp/

# IDE files
.vscode/
.idea/
*.swp
*.swo

# OS generated files
.DS_Store
.DS_Store?
._*
.Spotlight-V100
.Trashes
ehthumbs.db
Thumbs.db

# Temporary files
*.tmp
*.temp
.cache/

# API keys and sensitive data
config/production.json
secrets/
*.key
*.pem
`;
      
      fs.writeFileSync(path.join(this.projectPath, '.gitignore'), gitignoreContent.trim());
      console.log('✅ .gitignore created');
      
    } catch (error) {
      console.error(`❌ Git initialization failed: ${error.message}`);
    }
  }

  // Create production backup
  createBackup(commitMessage = 'Production backup') {
    try {
      console.log('💾 Creating production backup...');
      
      // Add all files
      execSync('git add .', { cwd: this.projectPath });
      
      // Check if there are changes to commit
      try {
        execSync('git diff --cached --exit-code', { cwd: this.projectPath, stdio: 'ignore' });
        console.log('ℹ️ No changes to backup');
        return false;
      } catch {
        // There are changes, proceed with commit
      }
      
      // Commit changes
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const fullMessage = `${commitMessage} - ${timestamp}`;
      
      execSync(`git commit -m "${fullMessage}"`, { cwd: this.projectPath });
      console.log(`✅ Backup created: ${fullMessage}`);
      
      // Create/update backup branch
      try {
        execSync(`git branch ${this.backupBranch}`, { cwd: this.projectPath, stdio: 'ignore' });
        console.log(`✅ Backup branch '${this.backupBranch}' created`);
      } catch {
        execSync(`git branch -f ${this.backupBranch}`, { cwd: this.projectPath, stdio: 'ignore' });
        console.log(`✅ Backup branch '${this.backupBranch}' updated`);
      }
      
      return true;
      
    } catch (error) {
      console.error(`❌ Backup failed: ${error.message}`);
      return false;
    }
  }

  // Restore from backup
  restoreFromBackup() {
    try {
      console.log('🔄 Restoring from production backup...');
      
      // Stash current changes
      try {
        execSync('git stash push -m "Pre-restore stash"', { cwd: this.projectPath });
        console.log('💾 Current changes stashed');
      } catch {
        // No changes to stash
      }
      
      // Switch to backup branch
      execSync(`git checkout ${this.backupBranch}`, { cwd: this.projectPath });
      console.log(`✅ Switched to backup branch: ${this.backupBranch}`);
      
      // Switch back to main and reset
      execSync('git checkout main', { cwd: this.projectPath });
      execSync(`git reset --hard ${this.backupBranch}`, { cwd: this.projectPath });
      
      console.log('✅ System restored from backup');
      return true;
      
    } catch (error) {
      console.error(`❌ Restore failed: ${error.message}`);
      return false;
    }
  }

  // List available backups
  listBackups() {
    try {
      console.log('📋 Available backups:');
      
      const commits = execSync('git log --oneline -10', { 
        cwd: this.projectPath, 
        encoding: 'utf8' 
      }).trim().split('\n');
      
      commits.forEach((commit, index) => {
        console.log(`   ${index + 1}. ${commit}`);
      });
      
      return commits;
      
    } catch (error) {
      console.error(`❌ Failed to list backups: ${error.message}`);
      return [];
    }
  }

  // Create deployment-ready package
  createDeploymentPackage() {
    try {
      console.log('📦 Creating deployment package...');
      
      // Create deployment info
      const deploymentInfo = {
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        environment: 'production',
        features: [
          'Multi-store Shopify integration',
          'AI-powered product enhancement',
          'Professional web interface',
          'Secure order processing',
          'Hebrew language support',
          'Real-time price comparison',
          'Chat-based customer interface'
        ],
        requirements: {
          node: '>=18.0.0',
          npm: '>=8.0.0'
        },
        env_variables: [
          'SHOPIFY_STORE_URL',
          'SHOPIFY_ACCESS_TOKEN',
          'ANTHROPIC_API_KEY (optional)',
          'OPENAI_API_KEY (optional)',
          'PORT (optional, defaults to 3000)'
        ]
      };
      
      fs.writeFileSync(
        path.join(this.projectPath, 'deployment-info.json'),
        JSON.stringify(deploymentInfo, null, 2)
      );
      
      // Create README for production
      const productionReadme = `
# Professional Multi-Store E-commerce Platform

## 🚀 Production Deployment

This is a professional multi-store e-commerce platform built for Shopify integration.

### Features
- ✅ Multi-store management dashboard
- ✅ AI-powered product descriptions and pricing
- ✅ Real-time cross-store price comparison
- ✅ Secure order processing with external payment
- ✅ Professional Hebrew interface
- ✅ Chat-based customer interaction
- ✅ Responsive design for mobile and desktop

### Quick Start

1. **Install dependencies:**
   \`\`\`bash
   npm install
   \`\`\`

2. **Configure environment:**
   \`\`\`bash
   cp .env.example .env
   # Edit .env with your credentials
   \`\`\`

3. **Build the system:**
   \`\`\`bash
   npm run build
   \`\`\`

4. **Start production server:**
   \`\`\`bash
   PORT=3001 node web-app.js
   \`\`\`

5. **Access the interface:**
   - Main interface: http://localhost:3001/store-manager.html
   - API endpoint: http://localhost:3001/api/

### Environment Variables

- \`SHOPIFY_STORE_URL\`: Your Shopify store URL
- \`SHOPIFY_ACCESS_TOKEN\`: Shopify Admin API access token
- \`ANTHROPIC_API_KEY\`: Claude API key for AI features (optional)
- \`OPENAI_API_KEY\`: OpenAI API key for AI features (optional)
- \`PORT\`: Server port (default: 3000)

### Git Commands for Maintenance

\`\`\`bash
# Create backup
node setup-git.js backup

# Restore from backup
node setup-git.js restore

# List backups
node setup-git.js list
\`\`\`

### Production Monitoring

The system includes built-in monitoring and error handling. Monitor logs for:
- Store connection status
- API rate limits
- Order processing errors
- AI service availability

### Security Notes

- Never commit API keys to the repository
- Use environment variables for all sensitive data
- Payment processing is handled externally by Shopify
- Order tokens are cryptographically secure

## Support

For technical support, check the deployment logs and ensure all environment variables are properly configured.
`;
      
      fs.writeFileSync(
        path.join(this.projectPath, 'PRODUCTION-README.md'),
        productionReadme.trim()
      );
      
      console.log('✅ Deployment package created');
      console.log('📋 Files created:');
      console.log('   - deployment-info.json');
      console.log('   - PRODUCTION-README.md');
      console.log('   - .gitignore');
      
      return true;
      
    } catch (error) {
      console.error(`❌ Package creation failed: ${error.message}`);
      return false;
    }
  }

  // Quick system status check
  systemStatus() {
    console.log('🔍 System Status Check:');
    
    const checks = [
      {
        name: 'Git Repository',
        check: () => {
          try {
            execSync('git status', { cwd: this.projectPath, stdio: 'ignore' });
            return true;
          } catch { return false; }
        }
      },
      {
        name: 'Node Modules',
        check: () => fs.existsSync(path.join(this.projectPath, 'node_modules'))
      },
      {
        name: 'Build Directory',
        check: () => fs.existsSync(path.join(this.projectPath, 'build'))
      },
      {
        name: 'Web Interface',
        check: () => fs.existsSync(path.join(this.projectPath, 'public/store-manager.html'))
      },
      {
        name: 'Main Server File',
        check: () => fs.existsSync(path.join(this.projectPath, 'web-app.js'))
      }
    ];
    
    checks.forEach(check => {
      const status = check.check() ? '✅' : '❌';
      console.log(`   ${status} ${check.name}`);
    });
  }
}

// Command line interface
function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  
  const gitManager = new GitManager();
  
  switch (command) {
    case 'init':
      gitManager.initializeGit();
      gitManager.createDeploymentPackage();
      break;
      
    case 'backup':
      const message = args[1] || 'Production backup';
      gitManager.createBackup(message);
      break;
      
    case 'restore':
      gitManager.restoreFromBackup();
      break;
      
    case 'list':
      gitManager.listBackups();
      break;
      
    case 'status':
      gitManager.systemStatus();
      break;
      
    case 'package':
      gitManager.createDeploymentPackage();
      break;
      
    default:
      console.log('🔧 Git Manager for Professional Multi-Store Platform');
      console.log('');
      console.log('Usage: node setup-git.js [command]');
      console.log('');
      console.log('Commands:');
      console.log('  init     - Initialize git repository and create deployment files');
      console.log('  backup   - Create production backup');
      console.log('  restore  - Restore from latest backup');
      console.log('  list     - List available backups');
      console.log('  status   - Check system status');
      console.log('  package  - Create deployment package');
      console.log('');
      console.log('Examples:');
      console.log('  node setup-git.js init');
      console.log('  node setup-git.js backup "Before major update"');
      console.log('  node setup-git.js restore');
      break;
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { GitManager };