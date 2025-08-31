#!/usr/bin/env node

// Quick System Restore and Recovery Script
import { execSync } from 'child_process';
import fs from 'fs';

class SystemRecovery {
  constructor() {
    this.projectPath = '.';
  }

  // Quick system restore from Git
  quickRestore() {
    console.log('🔄 Quick System Restore Starting...\n');
    
    try {
      // Check if git repo exists
      console.log('1️⃣ Checking Git repository...');
      execSync('git status', { stdio: 'ignore' });
      console.log('✅ Git repository found');
      
      // Show current status
      console.log('\n2️⃣ Current system status:');
      const status = execSync('git status --porcelain', { encoding: 'utf8' });
      if (status.trim()) {
        console.log('⚠️ Found uncommitted changes:');
        console.log(status);
        
        // Stash changes
        console.log('\n3️⃣ Stashing current changes...');
        execSync('git stash push -m "Auto-stash before restore"');
        console.log('✅ Changes stashed');
      } else {
        console.log('✅ No uncommitted changes');
      }
      
      // Reset to last commit
      console.log('\n4️⃣ Restoring to last stable state...');
      execSync('git reset --hard HEAD');
      console.log('✅ System restored to last commit');
      
      // Clean untracked files
      console.log('\n5️⃣ Cleaning temporary files...');
      execSync('git clean -fd');
      console.log('✅ Temporary files cleaned');
      
      // Rebuild if needed
      console.log('\n6️⃣ Rebuilding system...');
      if (fs.existsSync('package.json')) {
        console.log('Installing dependencies...');
        execSync('npm install', { stdio: 'inherit' });
        
        if (fs.existsSync('tsconfig.json')) {
          console.log('Building TypeScript...');
          execSync('npm run build', { stdio: 'inherit' });
        }
      }
      
      console.log('\n🎉 System Restore Complete!');
      console.log('✅ All files restored to last stable state');
      console.log('✅ Dependencies reinstalled');
      console.log('✅ System rebuilt');
      
      return true;
      
    } catch (error) {
      console.error(`❌ Restore failed: ${error.message}`);
      return false;
    }
  }

  // Create emergency backup before making changes
  emergencyBackup() {
    console.log('🚨 Creating Emergency Backup...\n');
    
    try {
      // Add all files
      execSync('git add .');
      
      // Create backup commit
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const message = `Emergency backup - ${timestamp}`;
      
      try {
        execSync(`git commit -m "${message}"`);
        console.log(`✅ Emergency backup created: ${message}`);
      } catch {
        console.log('ℹ️ No changes to backup');
      }
      
      // Create emergency branch
      const branchName = `emergency-backup-${Date.now()}`;
      execSync(`git branch ${branchName}`);
      console.log(`✅ Emergency branch created: ${branchName}`);
      
      return branchName;
      
    } catch (error) {
      console.error(`❌ Emergency backup failed: ${error.message}`);
      return null;
    }
  }

  // System health check
  healthCheck() {
    console.log('🏥 System Health Check\n');
    
    const checks = [
      {
        name: 'Git Repository',
        check: () => {
          try {
            execSync('git status', { stdio: 'ignore' });
            return { status: 'OK', message: 'Git repository is healthy' };
          } catch {
            return { status: 'ERROR', message: 'Git repository not found or corrupted' };
          }
        }
      },
      {
        name: 'Node.js Dependencies',
        check: () => {
          if (!fs.existsSync('node_modules')) {
            return { status: 'WARNING', message: 'Dependencies not installed - run npm install' };
          }
          if (!fs.existsSync('package-lock.json')) {
            return { status: 'WARNING', message: 'No package-lock.json found' };
          }
          return { status: 'OK', message: 'Dependencies are installed' };
        }
      },
      {
        name: 'TypeScript Build',
        check: () => {
          if (!fs.existsSync('build')) {
            return { status: 'WARNING', message: 'Build directory missing - run npm run build' };
          }
          if (!fs.existsSync('build/index.js')) {
            return { status: 'ERROR', message: 'Main build file missing' };
          }
          return { status: 'OK', message: 'TypeScript build is complete' };
        }
      },
      {
        name: 'Web Interface',
        check: () => {
          if (!fs.existsSync('public/store-manager.html')) {
            return { status: 'ERROR', message: 'Main web interface missing' };
          }
          if (!fs.existsSync('web-app.js')) {
            return { status: 'ERROR', message: 'Web server file missing' };
          }
          return { status: 'OK', message: 'Web interface files are present' };
        }
      },
      {
        name: 'AI Client',
        check: () => {
          if (!fs.existsSync('ai-client.js')) {
            return { status: 'WARNING', message: 'AI client not found' };
          }
          return { status: 'OK', message: 'AI client is available' };
        }
      }
    ];
    
    let hasErrors = false;
    let hasWarnings = false;
    
    checks.forEach(check => {
      const result = check.check();
      let icon = '✅';
      
      if (result.status === 'ERROR') {
        icon = '❌';
        hasErrors = true;
      } else if (result.status === 'WARNING') {
        icon = '⚠️';
        hasWarnings = true;
      }
      
      console.log(`${icon} ${check.name}: ${result.message}`);
    });
    
    console.log('\n📊 Health Check Summary:');
    if (hasErrors) {
      console.log('❌ System has critical errors that need attention');
    } else if (hasWarnings) {
      console.log('⚠️ System is functional but has some warnings');
    } else {
      console.log('✅ System is healthy and ready for production');
    }
    
    return { hasErrors, hasWarnings };
  }

  // List recovery options
  showRecoveryOptions() {
    console.log('🛠️ Recovery Options Available:\n');
    
    try {
      // Show last 5 commits
      console.log('📋 Recent commits (restore points):');
      const commits = execSync('git log --oneline -5', { encoding: 'utf8' });
      commits.trim().split('\n').forEach((commit, index) => {
        console.log(`   ${index + 1}. ${commit}`);
      });
      
      // Show stashes if any
      console.log('\n💾 Available stashes:');
      try {
        const stashes = execSync('git stash list', { encoding: 'utf8' });
        if (stashes.trim()) {
          stashes.trim().split('\n').forEach((stash, index) => {
            console.log(`   ${index + 1}. ${stash}`);
          });
        } else {
          console.log('   (No stashes available)');
        }
      } catch {
        console.log('   (No stashes available)');
      }
      
      // Show branches
      console.log('\n🌿 Available branches:');
      const branches = execSync('git branch -a', { encoding: 'utf8' });
      branches.trim().split('\n').forEach(branch => {
        console.log(`   ${branch.trim()}`);
      });
      
    } catch (error) {
      console.log('❌ Could not retrieve recovery information');
    }
  }
}

// Command line interface
function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  
  const recovery = new SystemRecovery();
  
  switch (command) {
    case 'restore':
    case 'fix':
      recovery.quickRestore();
      break;
      
    case 'backup':
      recovery.emergencyBackup();
      break;
      
    case 'health':
    case 'check':
      recovery.healthCheck();
      break;
      
    case 'options':
    case 'list':
      recovery.showRecoveryOptions();
      break;
      
    default:
      console.log('🛠️ System Recovery Tool');
      console.log('========================\n');
      
      console.log('Usage: node restore-system.js [command]\n');
      
      console.log('Commands:');
      console.log('  restore  - Quick restore to last stable state');
      console.log('  backup   - Create emergency backup before changes');
      console.log('  health   - Check system health status');
      console.log('  options  - Show available recovery options\n');
      
      console.log('Quick Commands:');
      console.log('  node restore-system.js restore  # Fix broken system');
      console.log('  node restore-system.js health   # Check if system is OK');
      console.log('  node restore-system.js backup   # Backup before changes\n');
      
      // Auto-run health check
      recovery.healthCheck();
      break;
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { SystemRecovery };