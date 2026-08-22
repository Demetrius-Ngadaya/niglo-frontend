'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { adminFetch, adminToken, imageUrl } from '@/lib/api';
import { AdminListSkeleton } from '@/components/AdminSkeleton';

type ServiceGalleryImage = { id: number; image_path: string; caption?: string | null };

type ServiceItem = {
  id: number;
  service_category_id: number;
  name: string;
  short_description?: string | null;
  description?: string | null;
  image_path?: string | null;
  starting_price?: string | null;
  featured: boolean;
  is_active: boolean;
  display_order: number;
  images?: ServiceGalleryImage[];
};

type Category = {
  id: number;
  name: string;
  description?: string | null;
  icon?: string | null;
  image_path?: string | null;
  display_order: number;
  is_active: boolean;
  services_count?: number;
};

const emptyCategoryDraft = { name: '', description: '', icon: '', display_order: 0, is_active: true };
const emptyServiceDraft = { name: '', short_description: '', starting_price: '', featured: false, is_active: true, display_order: 0 };

export default function AdminServicesPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [expandedCategoryId, setExpandedCategoryId] = useState<number | null>(null);
  const [addingCategory, setAddingCategory] = useState(false);
  const [categoryDraft, setCategoryDraft] = useState<typeof emptyCategoryDraft & { id?: number }>(emptyCategoryDraft);
  const [savingCategory, setSavingCategory] = useState(false);

  const [addingServiceFor, setAddingServiceFor] = useState<number | null>(null);
  const [editingServiceId, setEditingServiceId] = useState<number | null>(null);
  const [serviceDraft, setServiceDraft] = useState<typeof emptyServiceDraft & { image_path?: string | null }>(emptyServiceDraft);
  const [savingService, setSavingService] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingGalleryImage, setUploadingGalleryImage] = useState(false);

  const load = useCallback(() => {
    if (!adminToken()) {
      router.push('/admin/login');
      return;
    }
    setLoading(true);
    Promise.all([adminFetch('/admin/service-categories'), adminFetch('/admin/services')])
      .then(([cats, svcs]) => {
        setCategories(cats);
        setServices(svcs);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [router]);

  useEffect(() => {
    load();
  }, [load]);

  // --- Category actions ---

  function startAddCategory() {
    setCategoryDraft(emptyCategoryDraft);
    setAddingCategory(true);
  }

  function startEditCategory(cat: Category) {
    setCategoryDraft({
      id: cat.id,
      name: cat.name,
      description: cat.description || '',
      icon: cat.icon || '',
      display_order: cat.display_order,
      is_active: cat.is_active,
    });
    setAddingCategory(true);
  }

  async function saveCategory() {
    setSavingCategory(true);
    try {
      if (categoryDraft.id) {
        const updated = await adminFetch(`/admin/service-categories/${categoryDraft.id}`, {
          method: 'PUT',
          body: JSON.stringify(categoryDraft),
        });
        setCategories((prev) => prev.map((c) => (c.id === updated.id ? { ...c, ...updated } : c)));
      } else {
        const created = await adminFetch('/admin/service-categories', {
          method: 'POST',
          body: JSON.stringify(categoryDraft),
        });
        setCategories((prev) => [...prev, { ...created, services_count: 0 }]);
      }
      setAddingCategory(false);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to save category.');
    } finally {
      setSavingCategory(false);
    }
  }

  async function deleteCategory(id: number) {
    if (!confirm('Delete this category? Services inside it will also be removed.')) return;
    try {
      await adminFetch(`/admin/service-categories/${id}`, { method: 'DELETE' });
      setCategories((prev) => prev.filter((c) => c.id !== id));
      setServices((prev) => prev.filter((s) => s.service_category_id !== id));
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete.');
    }
  }

  // --- Service actions ---

  function startAddService(categoryId: number) {
    setServiceDraft({ ...emptyServiceDraft, image_path: null });
    setAddingServiceFor(categoryId);
    setEditingServiceId(null);
    setExpandedCategoryId(categoryId);
  }

  function startEditService(svc: ServiceItem) {
    setServiceDraft({
      name: svc.name,
      short_description: svc.short_description || '',
      starting_price: svc.starting_price || '',
      featured: svc.featured,
      is_active: svc.is_active,
      display_order: svc.display_order,
      image_path: svc.image_path,
    });
    setEditingServiceId(svc.id);
    setAddingServiceFor(svc.service_category_id);
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingImage(true);
    try {
      const form = new FormData();
      form.append('file', file);
      form.append('folder', 'services');
      const res = await adminFetch('/admin/upload', { method: 'POST', body: form });
      setServiceDraft((d) => ({ ...d, image_path: res.path }));
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Image upload failed.');
    } finally {
      setUploadingImage(false);
    }
  }

  async function handleGalleryImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0 || !editingServiceId) return;
    setUploadingGalleryImage(true);
    const failed: string[] = [];
    try {
      // Upload sequentially, but keep going even if one file fails — a single
      // oversized or invalid photo shouldn't stop the rest of the batch.
      for (const file of Array.from(files)) {
        try {
          const form = new FormData();
          form.append('file', file);
          form.append('folder', 'services');
          const uploaded = await adminFetch('/admin/upload', { method: 'POST', body: form });
          const image = await adminFetch(`/admin/services/${editingServiceId}/images`, {
            method: 'POST',
            body: JSON.stringify({ image_path: uploaded.path }),
          });
          setServices((prev) =>
            prev.map((s) => (s.id === editingServiceId ? { ...s, images: [...(s.images || []), image] } : s))
          );
        } catch (err) {
          failed.push(`${file.name} (${err instanceof Error ? err.message : 'upload failed'})`);
        }
      }
      if (failed.length > 0) {
        alert(`${failed.length} photo(s) could not be uploaded:\n\n${failed.join('\n')}\n\nEverything else in the batch uploaded successfully. Large photos (over 25MB) are the most common cause — try resizing and re-uploading those.`);
      }
    } finally {
      setUploadingGalleryImage(false);
      e.target.value = '';
    }
  }

  async function setAsCover(imagePath: string) {
    if (!editingServiceId) return;
    try {
      const updated = await adminFetch(`/admin/services/${editingServiceId}`, {
        method: 'PUT',
        body: JSON.stringify({ ...serviceDraft, image_path: imagePath, service_category_id: services.find((s) => s.id === editingServiceId)?.service_category_id }),
      });
      setServices((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
      setServiceDraft((d) => ({ ...d, image_path: imagePath }));
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to set cover photo.');
    }
  }

  async function deleteGalleryImage(imageId: number) {
    if (!editingServiceId) return;
    if (!confirm('Remove this photo?')) return;
    try {
      await adminFetch(`/admin/services/${editingServiceId}/images/${imageId}`, { method: 'DELETE' });
      setServices((prev) =>
        prev.map((s) =>
          s.id === editingServiceId ? { ...s, images: (s.images || []).filter((img) => img.id !== imageId) } : s
        )
      );
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to remove photo.');
    }
  }

  async function saveService(categoryId: number) {
    setSavingService(true);
    try {
      const payload = { ...serviceDraft, service_category_id: categoryId };
      if (editingServiceId) {
        const updated = await adminFetch(`/admin/services/${editingServiceId}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });
        setServices((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
        // Stay open — closing here was cutting people off from the Additional
        // Photos section right after saving the cover photo/details.
      } else {
        const created = await adminFetch('/admin/services', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        setServices((prev) => [...prev, created]);
        // Stay in the form, now in edit mode, so gallery photos can be added right away.
        setEditingServiceId(created.id);
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to save service.');
    } finally {
      setSavingService(false);
    }
  }

  async function deleteService(id: number) {
    if (!confirm('Delete this service?')) return;
    try {
      await adminFetch(`/admin/services/${id}`, { method: 'DELETE' });
      setServices((prev) => prev.filter((s) => s.id !== id));
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete.');
    }
  }

  return (
      <div className="max-w-6xl mx-auto px-6 py-16">
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="eyebrow mb-2">Admin</div>
            <h1 className="font-display text-3xl">Services &amp; Categories</h1>
          </div>
          <button onClick={startAddCategory} className="btn-primary text-sm">
            + Add Category
          </button>
        </div>

        {error && <p className="text-red-700 text-sm mb-6">{error}</p>}
        {loading && <AdminListSkeleton />}

        {addingCategory && (
          <div className="border border-brass/30 bg-brass/5 p-5 mb-8">
            <div className="eyebrow mb-4">{categoryDraft.id ? 'Edit Category' : 'New Category'}</div>
            <div className="grid sm:grid-cols-2 gap-3 mb-3">
              <input
                value={categoryDraft.name}
                onChange={(e) => setCategoryDraft((d) => ({ ...d, name: e.target.value }))}
                placeholder="Category name"
                className="border border-ink/15 dark:border-stone/15 px-3 py-2 bg-white text-sm focus-ring"
              />
              <input
                value={categoryDraft.icon}
                onChange={(e) => setCategoryDraft((d) => ({ ...d, icon: e.target.value }))}
                placeholder="Icon name (optional)"
                className="border border-ink/15 dark:border-stone/15 px-3 py-2 bg-white text-sm focus-ring"
              />
              <input
                type="number"
                value={categoryDraft.display_order}
                onChange={(e) => setCategoryDraft((d) => ({ ...d, display_order: Number(e.target.value) }))}
                placeholder="Display order"
                className="border border-ink/15 dark:border-stone/15 px-3 py-2 bg-white text-sm focus-ring"
              />
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={categoryDraft.is_active}
                  onChange={(e) => setCategoryDraft((d) => ({ ...d, is_active: e.target.checked }))}
                  className="accent-brass w-4 h-4"
                />
                Active (visible on site)
              </label>
            </div>
            <textarea
              value={categoryDraft.description}
              onChange={(e) => setCategoryDraft((d) => ({ ...d, description: e.target.value }))}
              placeholder="Description"
              rows={2}
              className="w-full border border-ink/15 dark:border-stone/15 px-3 py-2 bg-white text-sm focus-ring mb-3"
            />
            <div className="flex gap-3">
              <button onClick={saveCategory} disabled={savingCategory} className="btn-primary text-sm disabled:opacity-50">
                {savingCategory ? 'Saving…' : 'Save Category'}
              </button>
              <button onClick={() => setAddingCategory(false)} className="btn-outline text-sm">
                Cancel
              </button>
            </div>
          </div>
        )}

        <div className="space-y-4">
          {categories.map((cat) => (
            <div key={cat.id} className="border border-ink/10 dark:border-stone/10 bg-white/40 dark:bg-white/5">
              <div className="flex flex-wrap items-center gap-4 px-5 py-4">
                <button
                  onClick={() => setExpandedCategoryId(expandedCategoryId === cat.id ? null : cat.id)}
                  className="flex-1 text-left flex items-center gap-3"
                >
                  <span className="font-display text-lg">{cat.name}</span>
                  <span className="text-xs text-ink/40 dark:text-stone/50">{cat.services_count ?? 0} services</span>
                  {!cat.is_active && (
                    <span className="text-xs bg-ink/10 text-ink/50 dark:text-stone/60 px-2 py-0.5 rounded-full">Inactive</span>
                  )}
                </button>
                <button onClick={() => startAddService(cat.id)} className="text-sm text-brass hover:underline">
                  + Add Service
                </button>
                <button onClick={() => startEditCategory(cat)} className="text-sm hover:text-brass">
                  Edit
                </button>
                <button onClick={() => deleteCategory(cat.id)} className="text-sm text-red-700 hover:underline">
                  Delete
                </button>
              </div>

              {expandedCategoryId === cat.id && (
                <div className="border-t border-ink/10 dark:border-stone/10 px-5 py-5 space-y-3">
                  {services
                    .filter((s) => s.service_category_id === cat.id)
                    .map((svc) => (
                      <div key={svc.id} className="flex items-center gap-4 border border-ink/10 dark:border-stone/10 bg-white/60 dark:bg-white/5 p-3">
                        {svc.image_path && (
                          <img src={imageUrl(svc.image_path)!} alt={svc.name} className="w-12 h-12 object-cover flex-shrink-0" />
                        )}
                        <div className="flex-1">
                          <div className="font-medium text-sm">{svc.name}</div>
                          {svc.short_description && <div className="text-xs text-ink/50 dark:text-stone/60">{svc.short_description}</div>}
                        </div>
                        {svc.featured && <span className="text-xs bg-brass/20 text-brass px-2 py-0.5 rounded-full">Featured</span>}
                        {!svc.is_active && <span className="text-xs bg-ink/10 text-ink/50 dark:text-stone/60 px-2 py-0.5 rounded-full">Inactive</span>}
                        <button onClick={() => startEditService(svc)} className="text-sm hover:text-brass">Edit</button>
                        <button onClick={() => deleteService(svc.id)} className="text-sm text-red-700 hover:underline">Delete</button>
                      </div>
                    ))}
                  {services.filter((s) => s.service_category_id === cat.id).length === 0 && !addingServiceFor && (
                    <p className="text-sm text-ink/40 dark:text-stone/50">No services in this category yet.</p>
                  )}

                  {addingServiceFor === cat.id && (
                    <div className="border border-brass/30 bg-brass/5 p-4 mt-2">
                      <div className="eyebrow mb-3">{editingServiceId ? 'Edit Service' : 'New Service'}</div>
                      <div className="grid sm:grid-cols-2 gap-3 mb-3">
                        <input
                          value={serviceDraft.name}
                          onChange={(e) => setServiceDraft((d) => ({ ...d, name: e.target.value }))}
                          placeholder="Service name"
                          className="border border-ink/15 dark:border-stone/15 px-3 py-2 bg-white text-sm focus-ring"
                        />
                        <input
                          value={serviceDraft.starting_price}
                          onChange={(e) => setServiceDraft((d) => ({ ...d, starting_price: e.target.value }))}
                          placeholder="Starting price (e.g. 50,000 TZS)"
                          className="border border-ink/15 dark:border-stone/15 px-3 py-2 bg-white text-sm focus-ring"
                        />
                      </div>
                      <textarea
                        value={serviceDraft.short_description}
                        onChange={(e) => setServiceDraft((d) => ({ ...d, short_description: e.target.value }))}
                        placeholder="Short description"
                        rows={2}
                        className="w-full border border-ink/15 dark:border-stone/15 px-3 py-2 bg-white text-sm focus-ring mb-3"
                      />
                      <div className="flex items-center gap-4 mb-3">
                        <label className="flex items-center gap-2 text-sm">
                          <input
                            type="checkbox"
                            checked={serviceDraft.featured}
                            onChange={(e) => setServiceDraft((d) => ({ ...d, featured: e.target.checked }))}
                            className="accent-brass w-4 h-4"
                          />
                          Featured
                        </label>
                        <label className="flex items-center gap-2 text-sm">
                          <input
                            type="checkbox"
                            checked={serviceDraft.is_active}
                            onChange={(e) => setServiceDraft((d) => ({ ...d, is_active: e.target.checked }))}
                            className="accent-brass w-4 h-4"
                          />
                          Active
                        </label>
                      </div>
                      <div className="mb-4">
                        <div className="text-sm text-ink/60 dark:text-stone/60 mb-2">
                          Cover Photo — the one shown on the service card
                        </div>
                        <div className="flex items-center gap-3">
                          <input type="file" accept="image/*" onChange={handleImageUpload} className="text-sm" />
                          {uploadingImage && <span className="text-xs text-ink/50 dark:text-stone/60">Uploading…</span>}
                          {serviceDraft.image_path && (
                            <img src={imageUrl(serviceDraft.image_path)!} alt="" className="w-10 h-10 object-cover border border-ink/10 dark:border-stone/10" />
                          )}
                        </div>
                      </div>

                      {editingServiceId ? (
                        <div className="mb-4 border-t border-brass/20 pt-4">
                          <div className="text-sm text-ink/60 dark:text-stone/60 mb-1">
                            Gallery Photos — extra photos visitors browse when they open this service&apos;s gallery
                          </div>
                          <p className="text-xs text-ink/40 dark:text-stone/50 mb-3">
                            You can select several images at once. Hover a photo to remove it, or set it as the cover photo.
                          </p>
                          <div className="flex flex-wrap gap-3 mb-3">
                            {(services.find((s) => s.id === editingServiceId)?.images || []).map((img) => {
                              const isCover = img.image_path === serviceDraft.image_path;
                              return (
                                <div key={img.id} className="relative group">
                                  <img
                                    src={imageUrl(img.image_path)!}
                                    alt=""
                                    className={`w-20 h-20 object-cover border-2 ${isCover ? 'border-brass' : 'border-ink/10 dark:border-stone/10'}`}
                                  />
                                  {isCover && (
                                    <span className="absolute -top-2 left-1/2 -translate-x-1/2 bg-brass text-ink text-[10px] font-semibold px-2 py-0.5 whitespace-nowrap">
                                      Cover
                                    </span>
                                  )}
                                  <div className="absolute inset-0 bg-ink/0 group-hover:bg-ink/60 transition-colors flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100">
                                    {!isCover && (
                                      <button
                                        onClick={() => setAsCover(img.image_path)}
                                        title="Set as cover photo"
                                        className="bg-white text-ink text-[10px] px-1.5 py-1 hover:bg-brass"
                                      >
                                        Set Cover
                                      </button>
                                    )}
                                    <button
                                      onClick={() => deleteGalleryImage(img.id)}
                                      title="Remove photo"
                                      className="bg-red-600 text-white text-[10px] w-5 h-5 rounded-full flex items-center justify-center"
                                    >
                                      ✕
                                    </button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                          <input type="file" accept="image/*" multiple onChange={handleGalleryImageUpload} className="text-sm" />
                          {uploadingGalleryImage && <span className="text-xs text-ink/50 dark:text-stone/60 ml-2">Uploading…</span>}
                        </div>
                      ) : (
                        <p className="text-xs text-ink/40 dark:text-stone/50 mb-4">
                          Save this service first, then you can add gallery photos.
                        </p>
                      )}

                      <div className="flex gap-3">
                        <button
                          onClick={() => saveService(cat.id)}
                          disabled={savingService}
                          className="btn-primary text-sm disabled:opacity-50"
                        >
                          {savingService ? 'Saving…' : editingServiceId ? 'Save Changes' : 'Create Service'}
                        </button>
                        <button
                          onClick={() => { setAddingServiceFor(null); setEditingServiceId(null); }}
                          className="btn-outline text-sm"
                        >
                          {editingServiceId ? 'Done' : 'Cancel'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
          {!loading && categories.length === 0 && (
            <p className="text-ink/50 dark:text-stone/60 text-sm">No categories yet — add one to get started.</p>
          )}
        </div>
      </div>

  );
}
