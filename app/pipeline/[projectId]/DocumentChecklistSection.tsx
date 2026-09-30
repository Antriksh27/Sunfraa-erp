'use client';

import { useState } from 'react';
import { DocumentChecklistItem } from '@/types/database';
import { toggleDocumentChecklistAction } from '@/app/pipeline/actions';
import { createClient } from '@/lib/supabase/client';
import { FileText, CheckCircle2, Circle, Upload, ExternalLink, Loader2, Link as LinkIcon } from 'lucide-react';

interface DocumentChecklistSectionProps {
  projectId: string;
  checklistItems: DocumentChecklistItem[];
  category: string;
}

export default function DocumentChecklistSection({
  projectId,
  checklistItems,
  category,
}: DocumentChecklistSectionProps) {
  const [items, setItems] = useState<DocumentChecklistItem[]>(checklistItems);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [uploadingFileId, setUploadingFileId] = useState<string | null>(null);
  const [editingUrlId, setEditingUrlId] = useState<string | null>(null);
  const [tempUrl, setTempUrl] = useState('');
  const [error, setError] = useState<string | null>(null);

  const uploadedCount = items.filter((i) => i.uploaded).length;
  const totalCount = items.length;
  const percent = totalCount > 0 ? Math.round((uploadedCount / totalCount) * 100) : 0;

  async function handleToggle(item: DocumentChecklistItem) {
    const nextUploaded = !item.uploaded;
    setUpdatingId(item.id);
    setError(null);

    setItems((prev) =>
      prev.map((i) => (i.id === item.id ? { ...i, uploaded: nextUploaded } : i))
    );

    const res = await toggleDocumentChecklistAction(item.id, projectId, nextUploaded, item.file_url || undefined);
    if (res?.error) {
      setError(res.error);
      setItems((prev) =>
        prev.map((i) => (i.id === item.id ? { ...i, uploaded: item.uploaded } : i))
      );
    }
    setUpdatingId(null);
  }

  async function handleFileUpload(item: DocumentChecklistItem, e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingFileId(item.id);
    setError(null);
    try {
      const supabase = createClient();
      const fileExt = file.name.split('.').pop();
      const fileName = `checklist/${projectId}/${item.id}_${Date.now()}.${fileExt}`;

      const { data, error: uploadErr } = await supabase.storage
        .from('site-survey-photos')
        .upload(fileName, file);

      if (uploadErr) {
        setError(`Upload failed: ${uploadErr.message}`);
      } else if (data) {
        const { data: urlData } = supabase.storage
          .from('site-survey-photos')
          .getPublicUrl(fileName);

        const newUrl = urlData.publicUrl;
        setItems((prev) =>
          prev.map((i) =>
            i.id === item.id ? { ...i, file_url: newUrl, uploaded: true } : i
          )
        );

        const res = await toggleDocumentChecklistAction(item.id, projectId, true, newUrl);
        if (res?.error) {
          setError(res.error);
        }
      }
    } catch (err: any) {
      setError(err?.message || 'File upload failed.');
    } finally {
      setUploadingFileId(null);
    }
  }

  async function handleSaveUrl(item: DocumentChecklistItem) {
    setUpdatingId(item.id);
    setError(null);
    const nextUrl = tempUrl.trim() || null;

    setItems((prev) =>
      prev.map((i) =>
        i.id === item.id ? { ...i, file_url: nextUrl, uploaded: nextUrl ? true : i.uploaded } : i
      )
    );

    const res = await toggleDocumentChecklistAction(item.id, projectId, nextUrl ? true : item.uploaded, nextUrl || undefined);
    if (res?.error) {
      setError(res.error);
      setItems((prev) =>
        prev.map((i) => (i.id === item.id ? { ...i, file_url: item.file_url, uploaded: item.uploaded } : i))
      );
    }
    setEditingUrlId(null);
    setUpdatingId(null);
  }

  return (
    <div className="rounded-lg border border-[#e0e2e6] bg-[#ffffff] p-5 shadow-2xs space-y-4">
      {error && (
        <div className="rounded-md border border-[#fcab79] bg-[#fff0eb] p-2.5 text-xs text-[#aa2d00]">
          {error}
        </div>
      )}
      <div className="flex items-center justify-between border-b border-[#f0f2f5] pb-3">
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#181d26] flex items-center gap-2">
            <FileText className="h-4 w-4 text-[#181d26]" />
            Document Checklist ({uploadedCount}/{totalCount})
          </h3>
          <p className="text-[11px] text-[#5f6570]">
            Required documentation for {category.replace(/_/g, ' ')} solar installation
          </p>
        </div>
        <span className="text-xs font-bold text-[#181d26]">{percent}% Complete</span>
      </div>

      {/* Progress Bar */}
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#f0f2f5]">
        <div
          className={`h-full transition-all duration-300 ${
            percent === 100 ? 'bg-[#16a34a]' : 'bg-[#aa2d00]'
          }`}
          style={{ width: `${percent}%` }}
        />
      </div>

      {/* Checklist Items */}
      <div className="divide-y divide-[#f0f2f5]">
        {items.map((item) => (
          <div key={item.id} className="py-2.5 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <button
                type="button"
                onClick={() => handleToggle(item)}
                disabled={updatingId === item.id}
                className="shrink-0 text-[#181d26]"
              >
                {updatingId === item.id ? (
                  <Loader2 className="h-4 w-4 animate-spin text-[#9297a0]" />
                ) : item.uploaded ? (
                  <CheckCircle2 className="h-4 w-4 text-[#16a34a] fill-[#dcfce7]" />
                ) : (
                  <Circle className="h-4 w-4 text-[#9297a0] hover:text-[#181d26]" />
                )}
              </button>
              <div className="min-w-0">
                <span
                  className={`text-xs block truncate ${
                    item.uploaded ? 'text-[#181d26] font-medium' : 'text-[#41454d]'
                  }`}
                >
                  {item.document_name}
                </span>
                {item.file_url && (
                  <a
                    href={item.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[10px] text-[#aa2d00] hover:underline"
                  >
                    <span>View Attachment</span>
                    <ExternalLink className="h-2.5 w-2.5" />
                  </a>
                )}
              </div>
            </div>

            {/* Actions: File Upload & URL Editor */}
            <div className="flex items-center gap-2 shrink-0">
              {editingUrlId === item.id ? (
                <div className="flex items-center gap-1">
                  <input
                    type="url"
                    value={tempUrl}
                    onChange={(e) => setTempUrl(e.target.value)}
                    placeholder="https://drive.google.com/..."
                    className="h-6 w-44 rounded border border-[#e0e2e6] px-2 text-[11px] text-[#181d26] focus:border-[#181d26] focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => handleSaveUrl(item)}
                    className="rounded bg-[#181d26] px-2 py-0.5 text-[10px] font-semibold text-white"
                  >
                    Save
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingUrlId(null)}
                    className="text-[10px] text-[#5f6570] hover:text-[#181d26]"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-1.5">
                  <label className="inline-flex items-center gap-1 rounded border border-[#d0d4dc] bg-white px-2 py-0.5 text-[10px] font-medium text-[#181d26] hover:bg-[#fafbfc] cursor-pointer shadow-2xs transition-colors">
                    {uploadingFileId === item.id ? (
                      <>
                        <Loader2 className="h-3 w-3 animate-spin text-orange-600" />
                        <span>Uploading...</span>
                      </>
                    ) : (
                      <>
                        <Upload className="h-3 w-3 text-orange-600" />
                        <span>{item.file_url ? 'Replace File' : 'Upload File'}</span>
                      </>
                    )}
                    <input
                      type="file"
                      accept="image/*,.pdf,.doc,.docx"
                      disabled={uploadingFileId === item.id}
                      onChange={(e) => handleFileUpload(item, e)}
                      className="hidden"
                    />
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingUrlId(item.id);
                      setTempUrl(item.file_url || '');
                    }}
                    className="text-[10px] font-medium text-[#5f6570] hover:text-[#181d26] rounded border border-[#e0e2e6] px-1.5 py-0.5"
                    title="Paste direct URL"
                  >
                    <LinkIcon className="h-2.5 w-2.5" />
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
