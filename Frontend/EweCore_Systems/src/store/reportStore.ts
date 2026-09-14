import { create } from 'zustand';
import type { Report, ReportTemplate, ReportType, ReportFilter } from '../types/index';
import { mockReports, mockReportTemplates } from '../mock/reports';

interface ReportState {
  reports: Report[];
  templates: ReportTemplate[];
  selectedReport: Report | null;
  loading: boolean;
  generating: boolean;

  // Actions
  fetchReports: () => void;
  fetchTemplates: () => void;
  fetchReport: (id: string) => void;
  generateReport: (type: ReportType, filters: ReportFilter, userId: string, userName: string) => Promise<void>;
  deleteReport: (id: string) => Promise<void>;
}

export const useReportStore = create<ReportState>((set, get) => ({
  reports: [],
  templates: [],
  selectedReport: null,
  loading: false,
  generating: false,

  fetchReports: () => {
    set({ loading: true });

    // Simulate API call
    setTimeout(() => {
      set({ reports: [...mockReports], loading: false });
    }, 300);
  },

  fetchTemplates: () => {
    set({ loading: true });

    // Simulate API call
    setTimeout(() => {
      set({ templates: [...mockReportTemplates], loading: false });
    }, 200);
  },

  fetchReport: (id: string) => {
    set({ loading: true });

    // Simulate API call
    setTimeout(() => {
      const report = mockReports.find(r => r.id === id);
      set({ selectedReport: report || null, loading: false });
    }, 200);
  },

  generateReport: async (type, filters, userId, userName) => {
    set({ generating: true });

    // Simulate API call for report generation
    await new Promise(resolve => setTimeout(resolve, 2000));

    // In a real app, this would call the backend to generate the report
    // For now, we'll just return a mock report
    const template = mockReportTemplates.find(t => t.type === type);

    const newReport: Report = {
      id: `RPT${Date.now()}`,
      name: `${template?.name || 'Report'} - ${new Date().toLocaleDateString()}`,
      type,
      description: template?.description || 'Generated report',
      generatedBy: userId,
      generatedByName: userName,
      generatedAt: new Date().toISOString(),
      dateRange: {
        start: filters.startDate || '',
        end: filters.endDate || '',
      },
      filters,
      summary: {
        generated: 'Just now',
        status: 'Success',
      },
      charts: [],
      tableData: [],
      status: 'generated',
    };

    set(state => ({
      reports: [newReport, ...state.reports],
      generating: false,
      selectedReport: newReport,
    }));
  },

  deleteReport: async (id: string) => {
    set({ loading: true });

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500));

    set(state => ({
      reports: state.reports.filter(r => r.id !== id),
      loading: false,
      selectedReport: state.selectedReport?.id === id ? null : state.selectedReport,
    }));
  },
}));
