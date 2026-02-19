import { CheckCircle2, XCircle, Loader2, Download, RotateCcw, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatDatetime, formatRelative } from '@/lib/formatters'
import type { ReportJob, ReportFormat, ReportStatus } from '@/types'

interface ReportJobQueueProps {
  jobs:       ReportJob[]
  onRetry:    (jobId: string) => void
  onCancel:   (jobId: string) => void
  onDownload: (jobId: string) => void
}

const FORMAT_COLOR: Record<ReportFormat, string> = {
  PDF:  'bg-red-50  text-red-700  border-red-200',
  XLSX: 'bg-green-50 text-green-700 border-green-200',
  CSV:  'bg-yellow-50 text-yellow-700 border-yellow-200',
  JSON: 'bg-purple-50 text-purple-700 border-purple-200',
}

const STATUS_ICON: Record<ReportStatus, React.ReactNode> = {
  PENDING:    <Loader2 size={14} className="animate-spin text-gray-400" />,
  PROCESSING: <Loader2 size={14} className="animate-spin text-blue-500" />,
  READY:      <CheckCircle2 size={14} className="text-green-600" />,
  FAILED:     <XCircle    size={14} className="text-red-500"   />,
}

const STATUS_LABEL: Record<ReportStatus, string> = {
  PENDING:    'Pending',
  PROCESSING: 'Processing…',
  READY:      'Ready',
  FAILED:     'Failed',
}

const STATUS_PILL: Record<ReportStatus, string> = {
  PENDING:    'bg-gray-100  text-gray-600',
  PROCESSING: 'bg-blue-100  text-blue-700',
  READY:      'bg-green-100 text-green-700',
  FAILED:     'bg-red-100   text-red-700',
}

export function ReportJobQueue({ jobs, onRetry, onCancel, onDownload }: ReportJobQueueProps) {
  if (jobs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-gray-400">
        <Download size={32} className="mb-3 opacity-40" />
        <p className="text-sm font-medium">No reports generated yet</p>
        <p className="text-xs mt-1">Generate a report using the builder on the left</p>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs">
        <thead>
          <tr className="text-left border-b border-gray-100">
            <th className="pb-2 pr-3 font-semibold text-gray-500">Job ID</th>
            <th className="pb-2 pr-3 font-semibold text-gray-500">Report Type</th>
            <th className="pb-2 pr-3 font-semibold text-gray-500">Format</th>
            <th className="pb-2 pr-3 font-semibold text-gray-500">Status</th>
            <th className="pb-2 pr-3 font-semibold text-gray-500">Requested</th>
            <th className="pb-2     font-semibold text-gray-500">Action</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {jobs.map(job => (
            <tr key={job.jobId} className="hover:bg-gray-50/50 transition-colors group">
              <td className="py-2.5 pr-3 font-mono text-gray-500">{job.jobId}</td>
              <td className="py-2.5 pr-3 font-medium text-gray-800 max-w-[140px] truncate" title={job.reportType}>
                {job.reportType}
              </td>
              <td className="py-2.5 pr-3">
                <span className={cn('px-1.5 py-0.5 rounded border text-[10px] font-semibold', FORMAT_COLOR[job.format])}>
                  {job.format}
                </span>
              </td>
              <td className="py-2.5 pr-3">
                <span className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium', STATUS_PILL[job.status])}>
                  {STATUS_ICON[job.status]}
                  {STATUS_LABEL[job.status]}
                </span>
                {job.status === 'FAILED' && job.errorMessage && (
                  <p className="text-[10px] text-red-500 mt-0.5 max-w-[140px] truncate" title={job.errorMessage}>
                    {job.errorMessage}
                  </p>
                )}
              </td>
              <td className="py-2.5 pr-3 text-gray-500 whitespace-nowrap">
                <span title={formatDatetime(job.requestedAt)}>
                  {formatRelative(job.requestedAt)}
                </span>
              </td>
              <td className="py-2.5">
                <div className="flex items-center gap-1.5">
                  {job.status === 'READY' && (
                    <button
                      type="button"
                      onClick={() => onDownload(job.jobId)}
                      className="flex items-center gap-1 px-2 py-1 rounded-md bg-green-50 text-green-700 hover:bg-green-100 border border-green-200 text-[11px] font-medium transition-colors"
                    >
                      <Download size={11} />
                      Download
                    </button>
                  )}
                  {job.status === 'FAILED' && (
                    <button
                      type="button"
                      onClick={() => onRetry(job.jobId)}
                      className="flex items-center gap-1 px-2 py-1 rounded-md bg-orange-50 text-orange-700 hover:bg-orange-100 border border-orange-200 text-[11px] font-medium transition-colors"
                    >
                      <RotateCcw size={11} />
                      Retry
                    </button>
                  )}
                  {(job.status === 'PENDING' || job.status === 'PROCESSING') && (
                    <button
                      type="button"
                      onClick={() => onCancel(job.jobId)}
                      className="flex items-center gap-1 px-2 py-1 rounded-md bg-gray-50 text-gray-600 hover:bg-red-50 hover:text-red-600 border border-gray-200 text-[11px] font-medium transition-colors"
                    >
                      <X size={11} />
                      Cancel
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
