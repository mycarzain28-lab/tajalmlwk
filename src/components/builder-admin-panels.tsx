import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Plus, Pencil, Trash2, Save, X } from "lucide-react";

/* ========== helpers ========== */
function Loading() {
  return (
    <div className="flex justify-center py-10">
      <Loader2 className="w-6 h-6 animate-spin text-[var(--color-gold)]" />
    </div>
  );
}
function Empty({ msg }: { msg: string }) {
  return <div className="text-center py-10 text-sm text-[var(--color-ink-soft)]">{msg}</div>;
}
function Field({
  label, value, onChange, type = "text", textarea,
}: {
  label: string; value: string; onChange: (v: string) => void; type?: string; textarea?: boolean;
}) {
  return (
    <label className="block">
      <div className="text-xs font-bold mb-1">{label}</div>
      {textarea ? (
        <textarea className="input-clean w-full min-h-[100px]" value={value} onChange={(e) => onChange(e.target.value)} />
      ) : (
        <input type={type} className="input-clean w-full" value={value} onChange={(e) => onChange(e.target.value)} />
      )}
    </label>
  );
}

/* ========== Pages ========== */
type PageRow = {
  id: string; slug: string; title: string; description: string | null;
  status: string; is_home: boolean; sort_order: number;
};
export function BuilderPagesPanel() {
  const [rows, setRows] = useState<PageRow[] | null>(null);
  const [editing, setEditing] = useState<Partial<PageRow> | null>(null);

  const load = async () => {
    const { data } = await supabase.from("website_pages")
      .select("id,slug,title,description,status,is_home,sort_order")
      .order("sort_order");
    setRows((data as PageRow[]) || []);
  };
  useEffect(() => { load(); }, []);

  const save = async () => {
    if (!editing?.slug || !editing.title) return alert("العنوان والرابط مطلوبان");
    const payload = {
      slug: editing.slug, title: editing.title, description: editing.description || null,
      status: editing.status || "draft", is_home: !!editing.is_home, sort_order: editing.sort_order || 0,
    };
    const { error } = editing.id
      ? await supabase.from("website_pages").update(payload).eq("id", editing.id)
      : await supabase.from("website_pages").insert(payload);
    if (error) return alert(error.message);
    setEditing(null); load();
  };
  const remove = async (id: string) => {
    if (!confirm("حذف الصفحة؟")) return;
    const { error } = await supabase.from("website_pages").delete().eq("id", id);
    if (error) return alert(error.message);
    load();
  };

  if (!rows) return <Loading />;
  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-black">الصفحات</h2>
        <button className="btn-gold" onClick={() => setEditing({ status: "draft", sort_order: 0 })}>
          <Plus className="w-4 h-4" /> صفحة جديدة
        </button>
      </div>
      {rows.length === 0 ? <Empty msg="لا توجد صفحات بعد" /> : (
        <div className="grid gap-2">
          {rows.map((r) => (
            <div key={r.id} className="card-clean p-3 flex justify-between items-center gap-3">
              <div className="min-w-0">
                <div className="font-bold truncate">{r.title} {r.is_home && <span className="text-xs text-[var(--color-gold)]">★ رئيسية</span>}</div>
                <div className="text-xs text-[var(--color-ink-soft)]">/{r.slug} • {r.status === "published" ? "منشور" : "مسودة"}</div>
              </div>
              <div className="flex gap-2 shrink-0">
                <button className="btn-outline" onClick={() => setEditing(r)}><Pencil className="w-4 h-4" /></button>
                <button className="btn-outline text-red-600" onClick={() => remove(r.id)}><Trash2 className="w-4 h-4" /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      {editing && (
        <Modal onClose={() => setEditing(null)} title={editing.id ? "تعديل صفحة" : "صفحة جديدة"}>
          <div className="space-y-3">
            <Field label="العنوان" value={editing.title || ""} onChange={(v) => setEditing({ ...editing, title: v })} />
            <Field label="الرابط (slug)" value={editing.slug || ""} onChange={(v) => setEditing({ ...editing, slug: v })} />
            <Field label="الوصف" value={editing.description || ""} onChange={(v) => setEditing({ ...editing, description: v })} textarea />
            <div className="grid grid-cols-2 gap-3">
              <label className="block">
                <div className="text-xs font-bold mb-1">الحالة</div>
                <select className="input-clean w-full" value={editing.status || "draft"} onChange={(e) => setEditing({ ...editing, status: e.target.value })}>
                  <option value="draft">مسودة</option>
                  <option value="published">منشور</option>
                </select>
              </label>
              <Field label="الترتيب" type="number" value={String(editing.sort_order ?? 0)} onChange={(v) => setEditing({ ...editing, sort_order: +v })} />
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={!!editing.is_home} onChange={(e) => setEditing({ ...editing, is_home: e.target.checked })} />
              اجعلها الصفحة الرئيسية
            </label>
            <button className="btn-gold w-full" onClick={save}><Save className="w-4 h-4" /> حفظ</button>
          </div>
        </Modal>
      )}
    </div>
  );
}

/* ========== Sections ========== */
type SectionRow = { id: string; name: string; type: string; is_global: boolean; content: unknown };
export function BuilderSectionsPanel() {
  const [rows, setRows] = useState<SectionRow[] | null>(null);
  const [editing, setEditing] = useState<(Partial<SectionRow> & { contentText?: string }) | null>(null);
  const load = async () => {
    const { data } = await supabase.from("website_sections").select("*").order("created_at", { ascending: false });
    setRows((data as SectionRow[]) || []);
  };
  useEffect(() => { load(); }, []);

  const save = async () => {
    if (!editing?.name || !editing.type) return alert("الاسم والنوع مطلوبان");
    let content: unknown = {};
    try { content = editing.contentText ? JSON.parse(editing.contentText) : {}; }
    catch { return alert("محتوى JSON غير صالح"); }
    const payload = { name: editing.name, type: editing.type, is_global: !!editing.is_global, content };
    const { error } = editing.id
      ? await supabase.from("website_sections").update(payload).eq("id", editing.id)
      : await supabase.from("website_sections").insert(payload);
    if (error) return alert(error.message);
    setEditing(null); load();
  };
  const remove = async (id: string) => {
    if (!confirm("حذف القسم؟")) return;
    await supabase.from("website_sections").delete().eq("id", id);
    load();
  };

  if (!rows) return <Loading />;
  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-black">الأقسام</h2>
        <button className="btn-gold" onClick={() => setEditing({ type: "hero", contentText: "{}" })}>
          <Plus className="w-4 h-4" /> قسم جديد
        </button>
      </div>
      {rows.length === 0 ? <Empty msg="لا توجد أقسام" /> : (
        <div className="grid gap-2">
          {rows.map((r) => (
            <div key={r.id} className="card-clean p-3 flex justify-between items-center">
              <div>
                <div className="font-bold">{r.name}</div>
                <div className="text-xs text-[var(--color-ink-soft)]">{r.type} {r.is_global && "• عام"}</div>
              </div>
              <div className="flex gap-2">
                <button className="btn-outline" onClick={() => setEditing({ ...r, contentText: JSON.stringify(r.content, null, 2) })}><Pencil className="w-4 h-4" /></button>
                <button className="btn-outline text-red-600" onClick={() => remove(r.id)}><Trash2 className="w-4 h-4" /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      {editing && (
        <Modal onClose={() => setEditing(null)} title={editing.id ? "تعديل قسم" : "قسم جديد"}>
          <div className="space-y-3">
            <Field label="الاسم" value={editing.name || ""} onChange={(v) => setEditing({ ...editing, name: v })} />
            <label className="block">
              <div className="text-xs font-bold mb-1">النوع</div>
              <select className="input-clean w-full" value={editing.type || "hero"} onChange={(e) => setEditing({ ...editing, type: e.target.value })}>
                <option value="hero">Hero</option>
                <option value="features">مميزات</option>
                <option value="gallery">معرض صور</option>
                <option value="cta">Call to Action</option>
                <option value="text">نص</option>
                <option value="faq">أسئلة شائعة</option>
                <option value="testimonials">آراء عملاء</option>
                <option value="custom">مخصص</option>
              </select>
            </label>
            <Field label="المحتوى (JSON)" value={editing.contentText || "{}"} onChange={(v) => setEditing({ ...editing, contentText: v })} textarea />
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={!!editing.is_global} onChange={(e) => setEditing({ ...editing, is_global: e.target.checked })} />
              قسم عام (يظهر في كل الصفحات)
            </label>
            <button className="btn-gold w-full" onClick={save}><Save className="w-4 h-4" /> حفظ</button>
          </div>
        </Modal>
      )}
    </div>
  );
}

/* ========== Menus ========== */
type MenuRow = { id: string; location: string; label: string; url: string; sort_order: number; is_active: boolean };
export function BuilderMenusPanel() {
  const [rows, setRows] = useState<MenuRow[] | null>(null);
  const [editing, setEditing] = useState<Partial<MenuRow> | null>(null);
  const load = async () => {
    const { data } = await supabase.from("website_menus").select("*").order("location").order("sort_order");
    setRows((data as MenuRow[]) || []);
  };
  useEffect(() => { load(); }, []);
  const save = async () => {
    if (!editing?.label || !editing.url) return alert("النص والرابط مطلوبان");
    const payload = {
      location: editing.location || "header", label: editing.label, url: editing.url,
      sort_order: editing.sort_order || 0, is_active: editing.is_active !== false,
    };
    const { error } = editing.id
      ? await supabase.from("website_menus").update(payload).eq("id", editing.id)
      : await supabase.from("website_menus").insert(payload);
    if (error) return alert(error.message);
    setEditing(null); load();
  };
  const remove = async (id: string) => {
    if (!confirm("حذف؟")) return;
    await supabase.from("website_menus").delete().eq("id", id); load();
  };
  if (!rows) return <Loading />;
  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-black">القوائم</h2>
        <button className="btn-gold" onClick={() => setEditing({ location: "header", is_active: true })}><Plus className="w-4 h-4" /> رابط جديد</button>
      </div>
      {rows.length === 0 ? <Empty msg="لا توجد روابط" /> : (
        <div className="grid gap-2">
          {rows.map((r) => (
            <div key={r.id} className="card-clean p-3 flex justify-between items-center">
              <div>
                <div className="font-bold">{r.label} <span className="text-xs text-[var(--color-ink-soft)]">({r.location})</span></div>
                <div className="text-xs text-[var(--color-ink-soft)]" dir="ltr">{r.url}</div>
              </div>
              <div className="flex gap-2">
                <button className="btn-outline" onClick={() => setEditing(r)}><Pencil className="w-4 h-4" /></button>
                <button className="btn-outline text-red-600" onClick={() => remove(r.id)}><Trash2 className="w-4 h-4" /></button>
              </div>
            </div>
          ))}
        </div>
      )}
      {editing && (
        <Modal onClose={() => setEditing(null)} title={editing.id ? "تعديل رابط" : "رابط جديد"}>
          <div className="space-y-3">
            <label className="block">
              <div className="text-xs font-bold mb-1">الموقع</div>
              <select className="input-clean w-full" value={editing.location || "header"} onChange={(e) => setEditing({ ...editing, location: e.target.value })}>
                <option value="header">Header</option>
                <option value="footer">Footer</option>
                <option value="mobile">Mobile</option>
              </select>
            </label>
            <Field label="النص" value={editing.label || ""} onChange={(v) => setEditing({ ...editing, label: v })} />
            <Field label="الرابط" value={editing.url || ""} onChange={(v) => setEditing({ ...editing, url: v })} />
            <Field label="الترتيب" type="number" value={String(editing.sort_order ?? 0)} onChange={(v) => setEditing({ ...editing, sort_order: +v })} />
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={editing.is_active !== false} onChange={(e) => setEditing({ ...editing, is_active: e.target.checked })} />
              مفعل
            </label>
            <button className="btn-gold w-full" onClick={save}><Save className="w-4 h-4" /> حفظ</button>
          </div>
        </Modal>
      )}
    </div>
  );
}

/* ========== Theme ========== */
export function BuilderThemePanel() {
  const [theme, setTheme] = useState<{ id: string; name: string; tokens: Record<string, string> } | null>(null);
  const [text, setText] = useState("");
  useEffect(() => {
    supabase.from("website_theme").select("*").eq("is_active", true).limit(1).single().then(({ data }) => {
      if (data) {
        setTheme(data as { id: string; name: string; tokens: Record<string, string> });
        setText(JSON.stringify(data.tokens, null, 2));
      }
    });
  }, []);
  const save = async () => {
    if (!theme) return;
    let tokens: Record<string, string>;
    try { tokens = JSON.parse(text); } catch { return alert("JSON غير صالح"); }
    const { error } = await supabase.from("website_theme").update({ tokens, name: theme.name }).eq("id", theme.id);
    if (error) return alert(error.message);
    alert("تم الحفظ");
  };
  if (!theme) return <Loading />;
  return (
    <div className="space-y-3 max-w-2xl">
      <h2 className="text-lg font-black">الثيم</h2>
      <Field label="الاسم" value={theme.name} onChange={(v) => setTheme({ ...theme, name: v })} />
      <Field label="الرموز (JSON)" value={text} onChange={setText} textarea />
      <div className="text-xs text-[var(--color-ink-soft)]">مثال: {`{"primary":"#D4AF37","font":"Cairo"}`}</div>
      <button className="btn-gold" onClick={save}><Save className="w-4 h-4" /> حفظ</button>
    </div>
  );
}

/* ========== Media ========== */
type MediaRow = { id: string; url: string; alt: string | null; type: string; folder: string | null };
export function BuilderMediaPanel() {
  const [rows, setRows] = useState<MediaRow[] | null>(null);
  const [editing, setEditing] = useState<Partial<MediaRow> | null>(null);
  const load = async () => {
    const { data } = await supabase.from("website_media").select("*").order("created_at", { ascending: false }).limit(200);
    setRows((data as MediaRow[]) || []);
  };
  useEffect(() => { load(); }, []);
  const save = async () => {
    if (!editing?.url) return alert("الرابط مطلوب");
    const payload = { url: editing.url, alt: editing.alt || null, type: editing.type || "image", folder: editing.folder || "/" };
    const { error } = editing.id
      ? await supabase.from("website_media").update(payload).eq("id", editing.id)
      : await supabase.from("website_media").insert(payload);
    if (error) return alert(error.message);
    setEditing(null); load();
  };
  const remove = async (id: string) => {
    if (!confirm("حذف؟")) return;
    await supabase.from("website_media").delete().eq("id", id); load();
  };
  if (!rows) return <Loading />;
  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-black">مكتبة الوسائط</h2>
        <button className="btn-gold" onClick={() => setEditing({ type: "image", folder: "/" })}><Plus className="w-4 h-4" /> إضافة</button>
      </div>
      {rows.length === 0 ? <Empty msg="لا توجد وسائط" /> : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {rows.map((r) => (
            <div key={r.id} className="card-clean p-2">
              {r.type === "image" ? (
                <img src={r.url} alt={r.alt || ""} className="w-full h-28 object-cover rounded" />
              ) : (
                <div className="w-full h-28 flex items-center justify-center bg-[var(--color-surface)] rounded text-xs">{r.type}</div>
              )}
              <div className="text-xs mt-2 truncate">{r.alt || r.url.split("/").pop()}</div>
              <div className="flex gap-1 mt-2">
                <button className="btn-outline flex-1 text-xs py-1" onClick={() => setEditing(r)}><Pencil className="w-3 h-3" /></button>
                <button className="btn-outline text-red-600 text-xs py-1" onClick={() => remove(r.id)}><Trash2 className="w-3 h-3" /></button>
              </div>
            </div>
          ))}
        </div>
      )}
      {editing && (
        <Modal onClose={() => setEditing(null)} title={editing.id ? "تعديل وسيط" : "وسيط جديد"}>
          <div className="space-y-3">
            <Field label="الرابط (URL)" value={editing.url || ""} onChange={(v) => setEditing({ ...editing, url: v })} />
            <Field label="النص البديل" value={editing.alt || ""} onChange={(v) => setEditing({ ...editing, alt: v })} />
            <label className="block">
              <div className="text-xs font-bold mb-1">النوع</div>
              <select className="input-clean w-full" value={editing.type || "image"} onChange={(e) => setEditing({ ...editing, type: e.target.value })}>
                <option value="image">صورة</option>
                <option value="video">فيديو</option>
                <option value="file">ملف</option>
              </select>
            </label>
            <Field label="المجلد" value={editing.folder || "/"} onChange={(v) => setEditing({ ...editing, folder: v })} />
            <button className="btn-gold w-full" onClick={save}><Save className="w-4 h-4" /> حفظ</button>
          </div>
        </Modal>
      )}
    </div>
  );
}

/* ========== Forms & Submissions ========== */
type FormRow = { id: string; name: string; slug: string; notify_email: string | null; is_active: boolean; fields: unknown };
export function BuilderFormsPanel() {
  const [rows, setRows] = useState<FormRow[] | null>(null);
  const [editing, setEditing] = useState<(Partial<FormRow> & { fieldsText?: string }) | null>(null);
  const load = async () => {
    const { data } = await supabase.from("website_forms").select("*").order("created_at", { ascending: false });
    setRows((data as FormRow[]) || []);
  };
  useEffect(() => { load(); }, []);
  const save = async () => {
    if (!editing?.name || !editing.slug) return alert("الاسم والرابط مطلوبان");
    let fields: unknown = [];
    try { fields = editing.fieldsText ? JSON.parse(editing.fieldsText) : []; } catch { return alert("JSON غير صالح"); }
    const payload = { name: editing.name, slug: editing.slug, notify_email: editing.notify_email || null, is_active: editing.is_active !== false, fields };
    const { error } = editing.id
      ? await supabase.from("website_forms").update(payload).eq("id", editing.id)
      : await supabase.from("website_forms").insert(payload);
    if (error) return alert(error.message);
    setEditing(null); load();
  };
  const remove = async (id: string) => {
    if (!confirm("حذف النموذج؟")) return;
    await supabase.from("website_forms").delete().eq("id", id); load();
  };
  if (!rows) return <Loading />;
  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-black">النماذج</h2>
        <button className="btn-gold" onClick={() => setEditing({ is_active: true, fieldsText: '[{"name":"email","label":"البريد","type":"email"}]' })}><Plus className="w-4 h-4" /> نموذج جديد</button>
      </div>
      {rows.length === 0 ? <Empty msg="لا توجد نماذج" /> : (
        <div className="grid gap-2">
          {rows.map((r) => (
            <div key={r.id} className="card-clean p-3 flex justify-between items-center">
              <div>
                <div className="font-bold">{r.name}</div>
                <div className="text-xs text-[var(--color-ink-soft)]">/{r.slug} • {r.is_active ? "مفعل" : "معطل"}</div>
              </div>
              <div className="flex gap-2">
                <button className="btn-outline" onClick={() => setEditing({ ...r, fieldsText: JSON.stringify(r.fields, null, 2) })}><Pencil className="w-4 h-4" /></button>
                <button className="btn-outline text-red-600" onClick={() => remove(r.id)}><Trash2 className="w-4 h-4" /></button>
              </div>
            </div>
          ))}
        </div>
      )}
      {editing && (
        <Modal onClose={() => setEditing(null)} title={editing.id ? "تعديل نموذج" : "نموذج جديد"}>
          <div className="space-y-3">
            <Field label="الاسم" value={editing.name || ""} onChange={(v) => setEditing({ ...editing, name: v })} />
            <Field label="الرابط (slug)" value={editing.slug || ""} onChange={(v) => setEditing({ ...editing, slug: v })} />
            <Field label="بريد الإشعارات" value={editing.notify_email || ""} onChange={(v) => setEditing({ ...editing, notify_email: v })} />
            <Field label="الحقول (JSON Array)" value={editing.fieldsText || "[]"} onChange={(v) => setEditing({ ...editing, fieldsText: v })} textarea />
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={editing.is_active !== false} onChange={(e) => setEditing({ ...editing, is_active: e.target.checked })} />
              مفعل
            </label>
            <button className="btn-gold w-full" onClick={save}><Save className="w-4 h-4" /> حفظ</button>
          </div>
        </Modal>
      )}
    </div>
  );
}

type SubmissionRow = { id: string; form_id: string; data: unknown; created_at: string };
export function BuilderSubmissionsPanel() {
  const [rows, setRows] = useState<SubmissionRow[] | null>(null);
  const load = async () => {
    const { data } = await supabase.from("website_form_submissions").select("*").order("created_at", { ascending: false }).limit(200);
    setRows((data as SubmissionRow[]) || []);
  };
  useEffect(() => { load(); }, []);
  const remove = async (id: string) => {
    if (!confirm("حذف الرد؟")) return;
    await supabase.from("website_form_submissions").delete().eq("id", id); load();
  };
  if (!rows) return <Loading />;
  if (rows.length === 0) return <Empty msg="لا توجد ردود بعد" />;
  return (
    <div className="space-y-2">
      <h2 className="text-lg font-black">ردود النماذج</h2>
      {rows.map((r) => (
        <div key={r.id} className="card-clean p-3">
          <div className="flex justify-between items-start gap-2">
            <div className="text-xs text-[var(--color-ink-soft)]">{new Date(r.created_at).toLocaleString("ar")}</div>
            <button className="btn-outline text-red-600 text-xs" onClick={() => remove(r.id)}><Trash2 className="w-3 h-3" /></button>
          </div>
          <pre className="mt-2 text-xs bg-[var(--color-surface)] p-2 rounded overflow-x-auto" dir="ltr">
{JSON.stringify(r.data, null, 2)}
          </pre>
        </div>
      ))}
    </div>
  );
}

/* ========== Settings ========== */
type SettingRow = { key: string; value: unknown; is_public: boolean };
export function BuilderSettingsPanel() {
  const [rows, setRows] = useState<SettingRow[] | null>(null);
  const [editing, setEditing] = useState<(Partial<SettingRow> & { valueText?: string; isNew?: boolean }) | null>(null);
  const load = async () => {
    const { data } = await supabase.from("website_settings").select("*").order("key");
    setRows((data as SettingRow[]) || []);
  };
  useEffect(() => { load(); }, []);
  const save = async () => {
    if (!editing?.key) return alert("المفتاح مطلوب");
    let value: unknown;
    try { value = editing.valueText ? JSON.parse(editing.valueText) : null; }
    catch { return alert("JSON غير صالح"); }
    const payload = { key: editing.key, value, is_public: editing.is_public !== false };
    const { error } = await supabase.from("website_settings").upsert(payload);
    if (error) return alert(error.message);
    setEditing(null); load();
  };
  const remove = async (key: string) => {
    if (!confirm("حذف؟")) return;
    await supabase.from("website_settings").delete().eq("key", key); load();
  };
  if (!rows) return <Loading />;
  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-black">الإعدادات العامة</h2>
        <button className="btn-gold" onClick={() => setEditing({ isNew: true, is_public: true, valueText: '""' })}><Plus className="w-4 h-4" /> إعداد جديد</button>
      </div>
      {rows.length === 0 ? <Empty msg="لا توجد إعدادات" /> : (
        <div className="grid gap-2">
          {rows.map((r) => (
            <div key={r.key} className="card-clean p-3 flex justify-between items-center">
              <div className="min-w-0">
                <div className="font-bold">{r.key} {r.is_public ? "" : <span className="text-xs text-red-600">(خاص)</span>}</div>
                <div className="text-xs text-[var(--color-ink-soft)] truncate" dir="ltr">{JSON.stringify(r.value)}</div>
              </div>
              <div className="flex gap-2 shrink-0">
                <button className="btn-outline" onClick={() => setEditing({ ...r, valueText: JSON.stringify(r.value, null, 2) })}><Pencil className="w-4 h-4" /></button>
                <button className="btn-outline text-red-600" onClick={() => remove(r.key)}><Trash2 className="w-4 h-4" /></button>
              </div>
            </div>
          ))}
        </div>
      )}
      {editing && (
        <Modal onClose={() => setEditing(null)} title={editing.isNew ? "إعداد جديد" : "تعديل إعداد"}>
          <div className="space-y-3">
            <Field label="المفتاح" value={editing.key || ""} onChange={(v) => setEditing({ ...editing, key: v })} />
            <Field label="القيمة (JSON)" value={editing.valueText || ""} onChange={(v) => setEditing({ ...editing, valueText: v })} textarea />
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={editing.is_public !== false} onChange={(e) => setEditing({ ...editing, is_public: e.target.checked })} />
              مرئي للعامة
            </label>
            <button className="btn-gold w-full" onClick={save}><Save className="w-4 h-4" /> حفظ</button>
          </div>
        </Modal>
      )}
    </div>
  );
}

/* ========== Modal ========== */
function Modal({ children, onClose, title }: { children: React.ReactNode; onClose: () => void; title: string }) {
  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 overflow-y-auto" onClick={onClose}>
      <div className="bg-[var(--color-bg)] rounded-2xl max-w-lg w-full p-5 my-8" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-black">{title}</h3>
          <button onClick={onClose}><X className="w-5 h-5" /></button>
        </div>
        {children}
      </div>
    </div>
  );
}
