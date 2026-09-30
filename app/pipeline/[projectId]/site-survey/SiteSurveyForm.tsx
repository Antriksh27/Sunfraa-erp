'use client';

import { useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { submitSiteSurveyAction } from '@/app/pipeline/actions';
import {
  ArrowLeft,
  Camera,
  MapPin,
  Upload,
  X,
  AlertCircle,
  Loader2,
  CheckCircle2,
  Navigation,
} from 'lucide-react';
import { Project, SiteSurvey, UserRole } from '@/types/database';
import { getProjectUrlForRole } from '@/lib/navigation';

interface SiteSurveyFormProps {
  project: Project;
  existingSurvey: SiteSurvey | null;
  userRole?: UserRole;
}

export default function SiteSurveyForm({ project, existingSurvey, userRole }: SiteSurveyFormProps) {
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form states
  const [gpsLocation, setGpsLocation] = useState<string>(existingSurvey?.gps_location || '');
  const [photoUrls, setPhotoUrls] = useState<string[]>(existingSurvey?.photo_urls || []);
  const [diagramUrls, setDiagramUrls] = useState<string[]>(existingSurvey?.diagram_urls || []);

  const [sanctionedLoad, setSanctionedLoad] = useState<string>(project.sanctioned_load || '');
  const [connectionNumber, setConnectionNumber] = useState<string>(project.connection_number || '');

  // GPS Geolocation Auto-fetch
  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser.');
      return;
    }

    setGpsLocation('Locating GPS...');
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coords = `${position.coords.latitude.toFixed(6)}, ${position.coords.longitude.toFixed(6)}`;
        setGpsLocation(coords);
      },
      (err) => {
        setError(`Unable to retrieve GPS location: ${err.message}`);
        setGpsLocation('');
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // Upload Photos to Supabase Storage
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    setError(null);
    const supabase = createClient();
    const uploadedList: string[] = [...photoUrls];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const fileExt = file.name.split('.').pop();
      const fileName = `${project.id}/survey_${Date.now()}_${i}.${fileExt}`;

      const { data, error: uploadError } = await supabase.storage
        .from('site-survey-photos')
        .upload(fileName, file);

      if (uploadError) {
        setError(`Failed to upload photo: ${uploadError.message}`);
      } else if (data) {
        const { data: urlData } = supabase.storage
          .from('site-survey-photos')
          .getPublicUrl(fileName);
        uploadedList.push(urlData.publicUrl);
      }
    }

    setPhotoUrls(uploadedList);
    setUploading(false);
  };

  // Upload Diagrams
  const handleDiagramUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    setError(null);
    const supabase = createClient();
    const uploadedList: string[] = [...diagramUrls];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const fileExt = file.name.split('.').pop();
      const fileName = `${project.id}/diagram_${Date.now()}_${i}.${fileExt}`;

      const { data, error: uploadError } = await supabase.storage
        .from('site-survey-photos')
        .upload(fileName, file);

      if (uploadError) {
        setError(`Failed to upload diagram: ${uploadError.message}`);
      } else if (data) {
        const { data: urlData } = supabase.storage
          .from('site-survey-photos')
          .getPublicUrl(fileName);
        uploadedList.push(urlData.publicUrl);
      }
    }

    setDiagramUrls(uploadedList);
    setUploading(false);
  };

  const removePhoto = (index: number) => {
    setPhotoUrls(photoUrls.filter((_, i) => i !== index));
  };

  const removeDiagram = (index: number) => {
    setDiagramUrls(diagramUrls.filter((_, i) => i !== index));
  };

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    if (photoUrls.length === 0) {
      setError('At least 1 site photo is required for site survey verification.');
      return;
    }

    // Business Rule 3: Sanctioned Load and Connection Number fallback check
    if (!sanctionedLoad.trim() || !connectionNumber.trim()) {
      setError('Business Rule 3: Sanctioned Load and Connection Number must be filled to complete Site Survey.');
      return;
    }

    setLoading(true);

    const formData = new FormData(e.currentTarget);
    formData.set('photoUrls', JSON.stringify(photoUrls));
    formData.set('diagramUrls', JSON.stringify(diagramUrls));
    formData.set('gpsLocation', gpsLocation);
    formData.set('sanctionedLoad', sanctionedLoad);
    formData.set('connectionNumber', connectionNumber);

    const result = await submitSiteSurveyAction(project.id, formData);

    if (result?.error) {
      setError(result.error);
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Back Link & Header */}
      <div className="flex items-center gap-4">
        <Link
          href={getProjectUrlForRole(project.id, userRole || 'SITE_EXECUTION')}
          className="flex items-center gap-1.5 text-xs font-semibold text-[#5f6570] hover:text-[#181d26]"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Project
        </Link>
        <div>
          <h2 className="text-lg font-bold text-[#181d26]">
            Site Survey: {project.client_name}
          </h2>
          <p className="text-xs text-[#5f6570]">
            Mobile technical survey form ({project.kw_required} kW • {project.category.replace('_', ' ')})
          </p>
        </div>
      </div>

      {/* Form Card */}
      <div className="rounded-xl border border-[#e0e2e6] bg-white p-6 shadow-sm">
        <form className="space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700">
              <AlertCircle className="h-4 w-4 shrink-0 text-red-500" />
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#9297a0]">
              Technical On-Site Measurements
            </h3>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-semibold text-[#333840]">
                  Estimated / Proposed Number of Panels <span className="text-red-500">*</span>
                </label>
                <input
                  name="noOfPanels"
                  type="number"
                  min="1"
                  required
                  defaultValue={existingSurvey?.no_of_panels || Math.ceil(project.kw_required * 2)}
                  className="mt-1 block w-full rounded-lg border border-[#d0d4dc] px-3 py-2 text-sm text-[#181d26] focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#333840]">
                  On-Site Contact Person Name <span className="text-red-500">*</span>
                </label>
                <input
                  name="contactedPerson"
                  type="text"
                  required
                  defaultValue={existingSurvey?.contacted_person || project.client_name}
                  placeholder="Person met on-site"
                  className="mt-1 block w-full rounded-lg border border-[#d0d4dc] px-3 py-2 text-sm text-[#181d26] focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-[#333840]">
                  Physical Roof Measurements & Structural Notes <span className="text-red-500">*</span>
                </label>
                <textarea
                  name="physicalMeasurement"
                  rows={3}
                  required
                  defaultValue={existingSurvey?.physical_measurement || ''}
                  placeholder="e.g. RCC Roof 35ft x 20ft with south-facing clear area. Parapet wall 3ft. Structure height 6ft required."
                  className="mt-1 block w-full rounded-lg border border-[#d0d4dc] px-3 py-2 text-sm text-[#181d26] focus:border-amber-500 focus:outline-none"
                />
              </div>

              {/* GPS Geolocation Capture */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-[#333840]">
                  GPS Location Coordinates (Lat, Lng) <span className="text-red-500">*</span>
                </label>
                <div className="mt-1 flex gap-2">
                  <div className="relative flex-1">
                    <input
                      name="gpsLocation"
                      type="text"
                      required
                      value={gpsLocation}
                      onChange={(e) => setGpsLocation(e.target.value)}
                      placeholder="e.g. 23.022505, 72.571362"
                      className="block w-full rounded-lg border border-[#d0d4dc] py-2 pl-3 pr-9 text-sm text-[#181d26] focus:border-amber-500 focus:outline-none"
                    />
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-[#9297a0]">
                      <MapPin className="h-4 w-4" />
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleGetLocation}
                    className="flex items-center gap-1.5 rounded-lg bg-[#fff0eb] border border-[#fcab79] px-3.5 py-2 text-xs font-semibold text-[#882400] hover:bg-[#f5e9d4] shrink-0"
                  >
                    <Navigation className="h-3.5 w-3.5" />
                    Use Current GPS
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Business Rule 3: Sanctioned Load Fallback Validation */}
          <div className="rounded-lg border border-amber-200 bg-amber-50/60 p-4 space-y-3">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-amber-600 shrink-0" />
              <h4 className="text-xs font-bold text-amber-900">
                Mandatory DISCOM Sanction Verification (Business Rule 3)
              </h4>
            </div>
            <p className="text-[11px] text-amber-800">
              Must be verified from client electricity bill during on-site survey before survey completion can be accepted.
            </p>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-semibold text-[#333840]">
                  Sanctioned Load <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={sanctionedLoad}
                  onChange={(e) => setSanctionedLoad(e.target.value)}
                  placeholder="e.g. 10 kW / 15 HP"
                  className="mt-1 block w-full rounded-lg border border-[#d0d4dc] px-3 py-1.5 text-xs text-[#181d26] bg-white focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#333840]">
                  Electricity Connection Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={connectionNumber}
                  onChange={(e) => setConnectionNumber(e.target.value)}
                  placeholder="DISCOM Consumer / Meter No."
                  className="mt-1 block w-full rounded-lg border border-[#d0d4dc] px-3 py-1.5 text-xs text-[#181d26] bg-white focus:border-amber-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Photo & Diagram Uploads */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#9297a0]">
              Site Photos & Diagrams (Min 1 Photo)
            </h3>

            {/* Photos */}
            <div>
              <label className="block text-xs font-semibold text-[#333840] mb-1">
                Roof & Structural Photos <span className="text-red-500">*</span>
              </label>
              <div className="flex flex-wrap items-center gap-3">
                <label className="flex h-24 w-28 cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-[#d0d4dc] bg-[#fafbfc] hover:bg-[#f0f2f5]">
                  <Camera className="h-5 w-5 text-[#9297a0]" />
                  <span className="mt-1 text-[10px] font-semibold text-[#5f6570]">Add Photo</span>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handlePhotoUpload}
                    className="hidden"
                  />
                </label>

                {photoUrls.map((url, idx) => (
                  <div
                    key={idx}
                    className="relative h-24 w-28 overflow-hidden rounded-lg border border-[#e0e2e6] bg-[#f0f2f5] shadow-sm"
                  >
                    <img src={url} alt="Site" className="h-full w-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removePhoto(idx)}
                      className="absolute top-1 right-1 rounded-full bg-black/60 p-1 text-white hover:bg-red-600"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Diagrams */}
            <div>
              <label className="block text-xs font-semibold text-[#333840] mb-1">
                Hand-drawn Layout Diagrams (Optional)
              </label>
              <div className="flex flex-wrap items-center gap-3">
                <label className="flex h-20 w-28 cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-[#d0d4dc] bg-[#fafbfc] hover:bg-[#f0f2f5]">
                  <Upload className="h-4 w-4 text-[#9297a0]" />
                  <span className="mt-1 text-[10px] font-semibold text-[#5f6570]">Add Diagram</span>
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    multiple
                    onChange={handleDiagramUpload}
                    className="hidden"
                  />
                </label>

                {diagramUrls.map((url, idx) => (
                  <div
                    key={idx}
                    className="relative h-20 w-28 overflow-hidden rounded-lg border border-[#e0e2e6] bg-[#f0f2f5] shadow-sm"
                  >
                    <img src={url} alt="Diagram" className="h-full w-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removeDiagram(idx)}
                      className="absolute top-1 right-1 rounded-full bg-black/60 p-1 text-white hover:bg-red-600"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {uploading && (
              <div className="flex items-center gap-2 text-xs font-medium text-amber-600">
                <Loader2 className="h-4 w-4 animate-spin" />
                Uploading files to storage...
              </div>
            )}
          </div>

          <div className="flex items-center justify-end gap-3 border-t border-[#f0f2f5] pt-5">
            <Link
              href={getProjectUrlForRole(project.id, userRole || 'SITE_EXECUTION')}
              className="rounded-lg border border-[#d0d4dc] px-4 py-2 text-xs font-semibold text-[#333840] hover:bg-[#fafbfc]"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={loading || uploading}
              className="flex items-center gap-2 rounded-lg bg-[#aa2d00] px-5 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-[#882400] disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Submitting Survey...
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  Complete Site Survey
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
