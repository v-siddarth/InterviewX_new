// frontend/src/pages/Admin/SystemSettings.jsx
import React, { useState, useEffect } from 'react';
import { 
  Save, 
  RefreshCw, 
  Settings, 
  Database, 
  Mail, 
  Shield, 
  Zap,
  Globe,
  AlertTriangle,
  CheckCircle,
  Info,
  Upload,
  Download
} from 'lucide-react';
import { useAdminStore } from '../../store/adminStore';
import Button from '../../components/ui/Button';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import Alert from '../../components/ui/Alert';

const SystemSettings = () => {
  const { 
    systemSettings,
    loading, 
    fetchSystemSettings,
    updateSystemSettings
  } = useAdminStore();

  const [settings, setSettings] = useState({
    general: {
      siteName: 'InterviewX',
      siteDescription: 'AI-Powered Interview Assessment Platform',
      adminEmail: 'admin@interviewx.com',
      timezone: 'UTC',
      language: 'en',
      maintenanceMode: false
    },
    interview: {
      maxDuration: 60,
      minDuration: 5,
      defaultQuestionCount: 10,
      autoSave: true,
      allowRetakes: false,
      passThreshold: 70
    },
    ai: {
      faceAnalysisEnabled: true,
      audioAnalysisEnabled: true,
      textAnalysisEnabled: true,
      confidenceThreshold: 80,
      faceAnalysisUrl: 'http://localhost:8001',
      audioAnalysisUrl: 'http://localhost:8002',
      textAnalysisUrl: 'http://localhost:8003',
      geminiApiKey: '***********'
    },
    email: {
      smtpHost: 'smtp.gmail.com',
      smtpPort: 587,
      smtpUser: 'noreply@interviewx.com',
      smtpPassword: '***********',
      fromEmail: 'InterviewX <noreply@interviewx.com>',
      enableNotifications: true
    },
    security: {
      passwordMinLength: 8,
      requireSpecialChars: true,
      sessionTimeout: 24,
      maxLoginAttempts: 5,
      enableTwoFactor: false,
      allowedFileTypes: ['pdf', 'doc', 'docx', 'jpg', 'png', 'mp4'],
      maxFileSize: 10
    },
    backup: {
      autoBackup: true,
      backupFrequency: 'daily',
      retentionDays: 30,
      backupLocation: 'local'
    }
  });

  const [activeTab, setActiveTab] = useState('general');
  const [saving, setSaving] = useState(false);
  const [notification, setNotification] = useState(null);

  useEffect(() => {
    fetchSystemSettings();
  }, []);

  useEffect(() => {
    if (systemSettings) {
      setSettings(prev => ({ ...prev, ...systemSettings }));
    }
  }, [systemSettings]);

  const handleInputChange = (section, field, value) => {
    setSettings(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateSystemSettings(settings);
      setNotification({
        type: 'success',
        message: 'Settings saved successfully!'
      });
      setTimeout(() => setNotification(null), 3000);
    } catch (error) {
      setNotification({
        type: 'error',
        message: 'Failed to save settings. Please try again.'
      });
    } finally {
      setSaving(false);
    }
  };

  const handleTestConnection = async (service) => {
    setNotification({
      type: 'info',
      message: `Testing ${service} connection...`
    });
    
    // Simulate API call
    setTimeout(() => {
      setNotification({
        type: 'success',
        message: `${service} connection successful!`
      });
      setTimeout(() => setNotification(null), 3000);
    }, 2000);
  };

  const tabs = [
    { id: 'general', name: 'General', icon: Settings },
    { id: 'interview', name: 'Interview', icon: Zap },
    { id: 'ai', name: 'AI Services', icon: Database },
    { id: 'email', name: 'Email', icon: Mail },
    { id: 'security', name: 'Security', icon: Shield },
    { id: 'backup', name: 'Backup', icon: Upload }
  ];

  const SettingField = ({ label, type = 'text', value, onChange, description, required = false, options = [] }) => (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {type === 'select' ? (
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {options.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      ) : type === 'textarea' ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows="3"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      ) : type === 'checkbox' ? (
        <label className="flex items-center">
          <input
            type="checkbox"
            checked={value}
            onChange={(e) => onChange(e.target.checked)}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <span className="ml-2 text-sm text-gray-600">{description}</span>
        </label>
      ) : (
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(type === 'number' ? parseInt(e.target.value) : e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      )}
      {description && type !== 'checkbox' && (
        <p className="text-sm text-gray-500">{description}</p>
      )}
    </div>
  );

  const GeneralSettings = () => (
    <div className="space-y-6">
      <SettingField
        label="Site Name"
        value={settings.general.siteName}
        onChange={(value) => handleInputChange('general', 'siteName', value)}
        description="The name of your platform"
        required
      />
      <SettingField
        label="Site Description"
        type="textarea"
        value={settings.general.siteDescription}
        onChange={(value) => handleInputChange('general', 'siteDescription', value)}
        description="Brief description of your platform"
      />
      <SettingField
        label="Admin Email"
        type="email"
        value={settings.general.adminEmail}
        onChange={(value) => handleInputChange('general', 'adminEmail', value)}
        description="Primary contact email for administrators"
        required
      />
      <SettingField
        label="Timezone"
        type="select"
        value={settings.general.timezone}
        onChange={(value) => handleInputChange('general', 'timezone', value)}
        options={[
          { value: 'UTC', label: 'UTC' },
          { value: 'EST', label: 'Eastern Time' },
          { value: 'PST', label: 'Pacific Time' },
          { value: 'GMT', label: 'Greenwich Mean Time' }
        ]}
      />
      <SettingField
        label="Maintenance Mode"
        type="checkbox"
        value={settings.general.maintenanceMode}
        onChange={(value) => handleInputChange('general', 'maintenanceMode', value)}
        description="Enable to put the site in maintenance mode"
      />
    </div>
  );

  const InterviewSettings = () => (
    <div className="space-y-6">
      <SettingField
        label="Maximum Interview Duration (minutes)"
        type="number"
        value={settings.interview.maxDuration}
        onChange={(value) => handleInputChange('interview', 'maxDuration', value)}
        description="Maximum time allowed for an interview"
      />
      <SettingField
        label="Minimum Interview Duration (minutes)"
        type="number"
        value={settings.interview.minDuration}
        onChange={(value) => handleInputChange('interview', 'minDuration', value)}
        description="Minimum time required for an interview"
      />
      <SettingField
        label="Default Question Count"
        type="number"
        value={settings.interview.defaultQuestionCount}
        onChange={(value) => handleInputChange('interview', 'defaultQuestionCount', value)}
        description="Default number of questions in an interview"
      />
      <SettingField
        label="Pass Threshold (%)"
        type="number"
        value={settings.interview.passThreshold}
        onChange={(value) => handleInputChange('interview', 'passThreshold', value)}
        description="Minimum score required to pass an interview"
      />
      <SettingField
        label="Auto Save"
        type="checkbox"
        value={settings.interview.autoSave}
        onChange={(value) => handleInputChange('interview', 'autoSave', value)}
        description="Automatically save interview progress"
      />
      <SettingField
        label="Allow Retakes"
        type="checkbox"
        value={settings.interview.allowRetakes}
        onChange={(value) => handleInputChange('interview', 'allowRetakes', value)}
        description="Allow candidates to retake interviews"
      />
    </div>
  );

  const AISettings = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <SettingField
          label="Face Analysis"
          type="checkbox"
          value={settings.ai.faceAnalysisEnabled}
          onChange={(value) => handleInputChange('ai', 'faceAnalysisEnabled', value)}
          description="Enable facial confidence analysis"
        />
        <SettingField
          label="Audio Analysis"
          type="checkbox"
          value={settings.ai.audioAnalysisEnabled}
          onChange={(value) => handleInputChange('ai', 'audioAnalysisEnabled', value)}
          description="Enable voice and speech analysis"
        />
        <SettingField
          label="Text Analysis"
          type="checkbox"
          value={settings.ai.textAnalysisEnabled}
          onChange={(value) => handleInputChange('ai', 'textAnalysisEnabled', value)}
          description="Enable answer content analysis"
        />
      </div>
      
      <SettingField
        label="Confidence Threshold (%)"
        type="number"
        value={settings.ai.confidenceThreshold}
        onChange={(value) => handleInputChange('ai', 'confidenceThreshold', value)}
        description="Minimum confidence score required for analysis"
      />
      
      <div className="space-y-4">
        <h4 className="text-lg font-medium text-gray-900">AI Service URLs</h4>
        <SettingField
          label="Face Analysis Service URL"
          value={settings.ai.faceAnalysisUrl}
          onChange={(value) => handleInputChange('ai', 'faceAnalysisUrl', value)}
          description="URL for the facial analysis microservice"
        />
        <SettingField
          label="Audio Analysis Service URL"
          value={settings.ai.audioAnalysisUrl}
          onChange={(value) => handleInputChange('ai', 'audioAnalysisUrl', value)}
          description="URL for the audio analysis microservice"
        />
        <SettingField
          label="Text Analysis Service URL"
          value={settings.ai.textAnalysisUrl}
          onChange={(value) => handleInputChange('ai', 'textAnalysisUrl', value)}
          description="URL for the text analysis microservice"
        />
        <SettingField
          label="Gemini API Key"
          type="password"
          value={settings.ai.geminiApiKey}
          onChange={(value) => handleInputChange('ai', 'geminiApiKey', value)}
          description="API key for Google Gemini Pro"
        />
      </div>

      <div className="flex space-x-2">
        <Button variant="outline" onClick={() => handleTestConnection('Face Analysis')}>
          Test Face Analysis
        </Button>
        <Button variant="outline" onClick={() => handleTestConnection('Audio Analysis')}>
          Test Audio Analysis
        </Button>
        <Button variant="outline" onClick={() => handleTestConnection('Text Analysis')}>
          Test Text Analysis
        </Button>
      </div>
    </div>
  );

  const EmailSettings = () => (
    <div className="space-y-6">
      <SettingField
        label="SMTP Host"
        value={settings.email.smtpHost}
        onChange={(value) => handleInputChange('email', 'smtpHost', value)}
        description="SMTP server hostname"
      />
      <SettingField
        label="SMTP Port"
        type="number"
        value={settings.email.smtpPort}
        onChange={(value) => handleInputChange('email', 'smtpPort', value)}
        description="SMTP server port (usually 587 or 465)"
      />
      <SettingField
        label="SMTP Username"
        value={settings.email.smtpUser}
        onChange={(value) => handleInputChange('email', 'smtpUser', value)}
        description="SMTP authentication username"
      />
      <SettingField
        label="SMTP Password"
        type="password"
        value={settings.email.smtpPassword}
        onChange={(value) => handleInputChange('email', 'smtpPassword', value)}
        description="SMTP authentication password"
      />
      <SettingField
        label="From Email"
        type="email"
        value={settings.email.fromEmail}
        onChange={(value) => handleInputChange('email', 'fromEmail', value)}
        description="Default sender email address"
      />
      <SettingField
        label="Enable Email Notifications"
        type="checkbox"
        value={settings.email.enableNotifications}
        onChange={(value) => handleInputChange('email', 'enableNotifications', value)}
        description="Send email notifications for important events"
      />
      
      <Button variant="outline" onClick={() => handleTestConnection('Email')}>
        <Mail size={16} className="mr-2" />
        Test Email Connection
      </Button>
    </div>
  );

  const SecuritySettings = () => (
    <div className="space-y-6">
      <SettingField
        label="Minimum Password Length"
        type="number"
        value={settings.security.passwordMinLength}
        onChange={(value) => handleInputChange('security', 'passwordMinLength', value)}
        description="Minimum number of characters required for passwords"
      />
      <SettingField
        label="Require Special Characters"
        type="checkbox"
        value={settings.security.requireSpecialChars}
        onChange={(value) => handleInputChange('security', 'requireSpecialChars', value)}
        description="Require special characters in passwords"
      />
      <SettingField
        label="Session Timeout (hours)"
        type="number"
        value={settings.security.sessionTimeout}
        onChange={(value) => handleInputChange('security', 'sessionTimeout', value)}
        description="Automatically log out users after this many hours"
      />
      <SettingField
        label="Max Login Attempts"
        type="number"
        value={settings.security.maxLoginAttempts}
        onChange={(value) => handleInputChange('security', 'maxLoginAttempts', value)}
        description="Lock account after this many failed login attempts"
      />
      <SettingField
        label="Maximum File Size (MB)"
        type="number"
        value={settings.security.maxFileSize}
        onChange={(value) => handleInputChange('security', 'maxFileSize', value)}
        description="Maximum file size for uploads"
      />
      <SettingField
        label="Enable Two-Factor Authentication"
        type="checkbox"
        value={settings.security.enableTwoFactor}
        onChange={(value) => handleInputChange('security', 'enableTwoFactor', value)}
        description="Require 2FA for admin accounts"
      />
    </div>
  );

  const BackupSettings = () => (
    <div className="space-y-6">
      <SettingField
        label="Auto Backup"
        type="checkbox"
        value={settings.backup.autoBackup}
        onChange={(value) => handleInputChange('backup', 'autoBackup', value)}
        description="Automatically create backups"
      />
      <SettingField
        label="Backup Frequency"
        type="select"
        value={settings.backup.backupFrequency}
        onChange={(value) => handleInputChange('backup', 'backupFrequency', value)}
        options={[
          { value: 'hourly', label: 'Hourly' },
          { value: 'daily', label: 'Daily' },
          { value: 'weekly', label: 'Weekly' },
          { value: 'monthly', label: 'Monthly' }
        ]}
      />
      <SettingField
        label="Retention Period (days)"
        type="number"
        value={settings.backup.retentionDays}
        onChange={(value) => handleInputChange('backup', 'retentionDays', value)}
        description="How long to keep backup files"
      />
      <SettingField
        label="Backup Location"
        type="select"
        value={settings.backup.backupLocation}
        onChange={(value) => handleInputChange('backup', 'backupLocation', value)}
        options={[
          { value: 'local', label: 'Local Storage' },
          { value: 's3', label: 'Amazon S3' },
          { value: 'gcp', label: 'Google Cloud' },
          { value: 'azure', label: 'Azure Blob' }
        ]}
      />
      
      <div className="flex space-x-2">
        <Button variant="outline">
          <Upload size={16} className="mr-2" />
          Create Backup Now
        </Button>
        <Button variant="outline">
          <Download size={16} className="mr-2" />
          Download Latest Backup
        </Button>
      </div>
    </div>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'general': return <GeneralSettings />;
      case 'interview': return <InterviewSettings />;
      case 'ai': return <AISettings />;
      case 'email': return <EmailSettings />;
      case 'security': return <SecuritySettings />;
      case 'backup': return <BackupSettings />;
      default: return <GeneralSettings />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">System Settings</h1>
              <p className="text-gray-600 mt-1">Configure platform settings and preferences</p>
            </div>
            <div className="flex space-x-3">
              <Button variant="outline" onClick={() => fetchSystemSettings()}>
                <RefreshCw size={16} className="mr-2" />
                Reset
              </Button>
              <Button onClick={handleSave} disabled={saving}>
                <Save size={16} className="mr-2" />
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </div>
        </div>

        {/* Notification */}
        {notification && (
          <div className="mb-6">
            <Alert
              type={notification.type}
              message={notification.message}
              onClose={() => setNotification(null)}
            />
          </div>
        )}

        {/* Settings Content */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="flex">
            {/* Sidebar */}
            <div className="w-64 bg-gray-50 border-r">
              <nav className="p-4 space-y-2">
                {tabs.map(tab => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                        activeTab === tab.id
                          ? 'bg-blue-100 text-blue-700'
                          : 'text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      <Icon size={20} className="mr-3" />
                      {tab.name}
                    </button>
                  );
                })}
              </nav>
            </div>

            {/* Content */}
            <div className="flex-1 p-8">
              <div className="max-w-2xl">
                {renderTabContent()}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SystemSettings;