import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, type FormEvent } from "react";
import { BookOpen, FileText, Pencil, Plus, Trash2, Upload, X, Download, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, Field, PageHeader } from "@/components/kit";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { useTx } from "@/lib/tx";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/courses")({
  head: () => ({
    meta: [
      { title: "My Courses — NEMO" },
      { name: "description", content: "Manage courses, notes and files in NEMO." },
      { property: "og:title", content: "My Courses — NEMO" },
      { property: "og:description", content: "Manage courses, notes and files in NEMO." },
    ],
  }),
  component: CoursesPage,
});

type Course = Database["public"]["Tables"]["courses"]["Row"];
type Note = Database["public"]["Tables"]["course_notes"]["Row"];
type CourseFile = Database["public"]["Tables"]["course_files"]["Row"];
type CourseForm = {
  name: string;
  code: string;
  semester: string;
  instructor: string;
  description: string;
  color: string;
};
const emptyCourse: CourseForm = {
  name: "",
  code: "",
  semester: "",
  instructor: "",
  description: "",
  color: "#7c9d86",
};
const bucketPattern = /course.*file|file.*course/i;

function CoursesPage() {
  const { tx, lang } = useTx();
  const queryClient = useQueryClient();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [courseFormOpen, setCourseFormOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<string | null>(null);
  const [courseForm, setCourseForm] = useState<CourseForm>(emptyCourse);
  const [noteId, setNoteId] = useState<string | null>(null);
  const [noteTitle, setNoteTitle] = useState("");
  const [noteContent, setNoteContent] = useState("");
  const [fileBusy, setFileBusy] = useState(false);

  const coursesQuery = useQuery({
    queryKey: ["courses", "page"],
    queryFn: async () => {
      const { data: auth, error: authError } = await supabase.auth.getUser();
      if (authError) throw authError;
      if (!auth.user)
        throw new Error(tx("Please sign in to load your courses.", "سجّل الدخول لعرض موادك."));
      const { data, error } = await supabase
        .from("courses")
        .select("*")
        .eq("user_id", auth.user.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
  const courses = coursesQuery.data ?? [];
  const selected = courses.find((course) => course.id === selectedId) ?? courses[0] ?? null;
  const activeId = selected?.id ?? null;

  const notesQuery = useQuery({
    queryKey: ["course_notes", activeId],
    enabled: !!activeId,
    queryFn: async () => {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user || !activeId) return [] as Note[];
      const { data, error } = await supabase
        .from("course_notes")
        .select("*")
        .eq("course_id", activeId)
        .eq("user_id", auth.user.id)
        .order("updated_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
  const filesQuery = useQuery({
    queryKey: ["course_files", activeId],
    enabled: !!activeId,
    queryFn: async () => {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user || !activeId) return [] as CourseFile[];
      const { data, error } = await supabase
        .from("course_files")
        .select("*")
        .eq("course_id", activeId)
        .eq("user_id", auth.user.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const saveCourse = useMutation({
    mutationFn: async () => {
      const { data: auth, error: authError } = await supabase.auth.getUser();
      if (authError) throw authError;
      if (!auth.user) throw new Error(tx("Please sign in again.", "يرجى تسجيل الدخول مجددًا."));
      const values = {
        name: courseForm.name.trim(),
        code: courseForm.code.trim() || null,
        semester: courseForm.semester.trim() || null,
        instructor: courseForm.instructor.trim() || null,
        description: courseForm.description.trim() || null,
        color: courseForm.color,
      };
      if (!values.name) throw new Error(tx("Course name is required.", "اسم المادة مطلوب."));
      if (editingCourse) {
        const { error } = await supabase
          .from("courses")
          .update(values)
          .eq("id", editingCourse)
          .eq("user_id", auth.user.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("courses")
          .insert({ ...values, user_id: auth.user.id });
        if (error) throw error;
      }
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["courses", "page"] });
      setCourseFormOpen(false);
      setEditingCourse(null);
      setCourseForm(emptyCourse);
      toast.success(tx("Course saved.", "تم حفظ المادة."));
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const removeCourse = useMutation({
    mutationFn: async (course: Course) => {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) throw new Error(tx("Please sign in again.", "يرجى تسجيل الدخول مجددًا."));
      const { error } = await supabase
        .from("courses")
        .delete()
        .eq("id", course.id)
        .eq("user_id", auth.user.id);
      if (error) throw error;
    },
    onSuccess: async (_, course) => {
      await queryClient.invalidateQueries({ queryKey: ["courses", "page"] });
      setSelectedId((id) => (id === course.id ? null : id));
      toast.success(tx("Course deleted.", "تم حذف المادة."));
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const saveNote = useMutation({
    mutationFn: async () => {
      if (!activeId) throw new Error(tx("Choose a course first.", "اختر مادة أولًا."));
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) throw new Error(tx("Please sign in again.", "يرجى تسجيل الدخول مجددًا."));
      const values = {
        title: noteTitle.trim() || tx("Untitled note", "ملاحظة بلا عنوان"),
        content: noteContent,
        course_id: activeId,
        user_id: auth.user.id,
      };
      const result = noteId
        ? await supabase
            .from("course_notes")
            .update({ title: values.title, content: values.content })
            .eq("id", noteId)
            .eq("course_id", activeId)
            .eq("user_id", auth.user.id)
        : await supabase.from("course_notes").insert(values);
      if (result.error) throw result.error;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["course_notes", activeId] });
      setNoteId(null);
      setNoteTitle("");
      setNoteContent("");
      toast.success(tx("Note saved.", "تم حفظ الملاحظة."));
    },
    onError: (error: Error) => toast.error(error.message),
  });
  const removeNote = useMutation({
    mutationFn: async (id: string) => {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) throw new Error(tx("Please sign in again.", "يرجى تسجيل الدخول مجددًا."));
      const { error } = await supabase
        .from("course_notes")
        .delete()
        .eq("id", id)
        .eq("user_id", auth.user.id);
      if (error) throw error;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["course_notes", activeId] });
      toast.success(tx("Note deleted.", "تم حذف الملاحظة."));
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const startCourseEdit = (course?: Course) => {
    setCourseFormOpen(true);
    setEditingCourse(course?.id ?? null);
    setCourseForm(
      course
        ? {
            name: course.name,
            code: course.code ?? "",
            semester: course.semester ?? "",
            instructor: course.instructor ?? "",
            description: course.description ?? "",
            color: course.color || "#7c9d86",
          }
        : emptyCourse,
    );
  };
  const submitCourse = (event: FormEvent) => {
    event.preventDefault();
    saveCourse.mutate();
  };
  const submitNote = (event: FormEvent) => {
    event.preventDefault();
    saveNote.mutate();
  };
  const editNote = (note: Note) => {
    setNoteId(note.id);
    setNoteTitle(note.title);
    setNoteContent(note.content);
  };

  const uploadFile = async (file?: File) => {
    if (!file || !activeId) return;
    setFileBusy(true);
    try {
      const { data: auth, error: authError } = await supabase.auth.getUser();
      if (authError) throw authError;
      if (!auth.user) throw new Error(tx("Please sign in again.", "يرجى تسجيل الدخول مجددًا."));
      const { data: buckets, error: bucketError } = await supabase.storage.listBuckets();
      if (bucketError)
        throw new Error(
          tx(
            "Storage is unavailable for this account. Ask an administrator to enable Storage access and a course-files bucket.",
            "التخزين غير متاح لهذا الحساب. اطلب من المسؤول تفعيل Storage وإعداد مساحة course-files.",
          ),
        );
      const bucket = buckets.find((item) => bucketPattern.test(item.name));
      if (!bucket)
        throw new Error(
          tx(
            "No existing course-files Storage bucket was found. Configure a bucket whose name includes both ‘course’ and ‘file’, plus upload/read policies; no file was saved.",
            "لم يتم العثور على مساحة Storage موجودة لملفات المواد. أعدّ مساحة يتضمن اسمها course وfile مع سياسات الرفع والقراءة؛ لم يُحفظ أي ملف.",
          ),
        );
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
      const objectPath = `${auth.user.id}/${activeId}/${Date.now()}-${safeName}`;
      const { error: uploadError } = await supabase.storage
        .from(bucket.name)
        .upload(objectPath, file, {
          ...(file.type ? { contentType: file.type } : {}),
          upsert: false,
        });
      if (uploadError)
        throw new Error(
          tx(
            `Storage upload failed: ${uploadError.message}`,
            `فشل رفع الملف: ${uploadError.message}`,
          ),
        );
      const { error: insertError } = await supabase.from("course_files").insert({
        course_id: activeId,
        user_id: auth.user.id,
        name: file.name,
        path: objectPath,
        mime: file.type || null,
        size: file.size,
      });
      if (insertError) {
        await supabase.storage.from(bucket.name).remove([objectPath]);
        throw new Error(
          tx(
            `File metadata could not be saved; uploaded object was removed: ${insertError.message}`,
            `تعذر حفظ سجل الملف؛ أزيل الملف المرفوع: ${insertError.message}`,
          ),
        );
      }
      await queryClient.invalidateQueries({ queryKey: ["course_files", activeId] });
      toast.success(tx("File uploaded and recorded.", "تم رفع الملف وتسجيله."));
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : tx("File upload failed.", "فشل رفع الملف."),
      );
    } finally {
      setFileBusy(false);
    }
  };
  const openFile = async (file: CourseFile) => {
    try {
      const { data: buckets, error } = await supabase.storage.listBuckets();
      if (error) throw error;
      const bucket = buckets.find((item) => bucketPattern.test(item.name));
      if (!bucket)
        throw new Error(
          tx(
            "The configured Storage bucket is not available.",
            "مساحة Storage المضبوطة غير متاحة.",
          ),
        );
      const { data, error: urlError } = await supabase.storage
        .from(bucket.name)
        .createSignedUrl(file.path, 60);
      if (urlError) throw urlError;
      window.open(data.signedUrl, "_blank", "noopener,noreferrer");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : tx("Could not open this file.", "تعذر فتح الملف."),
      );
    }
  };
  const deleteFile = async (file: CourseFile) => {
    if (!window.confirm(tx(`Delete “${file.name}”?`, `هل تريد حذف «${file.name}»؟`))) return;
    try {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) throw new Error(tx("Please sign in again.", "يرجى تسجيل الدخول مجددًا."));
      const { data: buckets, error: bucketError } = await supabase.storage.listBuckets();
      if (bucketError) throw bucketError;
      const bucket = buckets.find((item) => bucketPattern.test(item.name));
      if (bucket) {
        const { error } = await supabase.storage.from(bucket.name).remove([file.path]);
        if (error) throw error;
      }
      const { error } = await supabase
        .from("course_files")
        .delete()
        .eq("id", file.id)
        .eq("user_id", auth.user.id);
      if (error) throw error;
      await queryClient.invalidateQueries({ queryKey: ["course_files", activeId] });
      toast.success(tx("File deleted.", "تم حذف الملف."));
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : tx("Could not delete this file.", "تعذر حذف الملف."),
      );
    }
  };

  const errorMessage = coursesQuery.error instanceof Error ? coursesQuery.error.message : null;
  return (
    <main
      dir={lang === "ar" ? "rtl" : "ltr"}
      className="mx-auto w-full max-w-6xl px-3 pb-10 sm:px-6"
    >
      <PageHeader
        title={tx("My courses", "موادي")}
        sub={tx(
          "Keep course details, notes and files together.",
          "اجمع تفاصيل المواد وملاحظاتها وملفاتها في مكان واحد.",
        )}
        action={
          <Button onClick={() => startCourseEdit()}>
            <Plus />
            {tx("Add course", "إضافة مادة")}
          </Button>
        }
      />
      {errorMessage && (
        <p
          role="alert"
          className="mb-4 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive"
        >
          {tx("Could not load courses:", "تعذر تحميل المواد:")} {errorMessage}
        </p>
      )}
      {coursesQuery.isLoading ? (
        <p className="py-10 text-center text-muted-foreground">
          {tx("Loading courses…", "جارٍ تحميل المواد…")}
        </p>
      ) : (
        <div className="grid gap-5 lg:grid-cols-[minmax(230px,0.8fr)_minmax(0,2fr)]">
          <Card title={tx("Your courses", "المواد المسجلة")}>
            {courses.length === 0 ? (
              <div className="py-8 text-center">
                <BookOpen className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  {tx(
                    "No courses yet. Add your first course to get started.",
                    "لا توجد مواد بعد. أضف مادتك الأولى للبدء.",
                  )}
                </p>
              </div>
            ) : (
              <ul className="grid gap-2">
                {courses.map((course) => (
                  <li key={course.id}>
                    <button
                      onClick={() => {
                        setSelectedId(course.id);
                        setNoteId(null);
                      }}
                      className={`flex w-full items-start gap-3 rounded-lg border p-3 text-start transition hover:bg-accent ${selected?.id === course.id ? "border-primary/50 bg-accent/60" : "border-border"}`}
                    >
                      <span
                        className="mt-1 h-3 w-3 shrink-0 rounded-full"
                        style={{ backgroundColor: course.color || "#7c9d86" }}
                      />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-semibold">{course.name}</span>
                        <span className="block truncate text-xs text-muted-foreground">
                          {[course.code, course.semester].filter(Boolean).join(" · ") ||
                            tx("Course", "مادة")}
                        </span>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </Card>
          <div className="grid content-start gap-5">
            {courseFormOpen ? (
              <Card
                title={
                  editingCourse ? tx("Edit course", "تعديل المادة") : tx("New course", "مادة جديدة")
                }
              >
                <form onSubmit={submitCourse} className="grid gap-3 sm:grid-cols-2">
                  <Field label={tx("Course name *", "اسم المادة *")}>
                    <Input
                      required
                      value={courseForm.name}
                      onChange={(e) => setCourseForm({ ...courseForm, name: e.target.value })}
                    />
                  </Field>
                  <Field label={tx("Course code", "رمز المادة")}>
                    <Input
                      value={courseForm.code}
                      onChange={(e) => setCourseForm({ ...courseForm, code: e.target.value })}
                    />
                  </Field>
                  <Field label={tx("Semester", "الفصل الدراسي")}>
                    <Input
                      value={courseForm.semester}
                      onChange={(e) => setCourseForm({ ...courseForm, semester: e.target.value })}
                    />
                  </Field>
                  <Field label={tx("Instructor", "المدرّس")}>
                    <Input
                      value={courseForm.instructor}
                      onChange={(e) => setCourseForm({ ...courseForm, instructor: e.target.value })}
                    />
                  </Field>
                  <Field label={tx("Color", "اللون")}>
                    <Input
                      type="color"
                      className="h-9 p-1"
                      value={courseForm.color}
                      onChange={(e) => setCourseForm({ ...courseForm, color: e.target.value })}
                    />
                  </Field>
                  <div className="sm:col-span-2">
                    <Field label={tx("Description", "الوصف")}>
                      <Textarea
                        rows={3}
                        value={courseForm.description}
                        onChange={(e) =>
                          setCourseForm({ ...courseForm, description: e.target.value })
                        }
                      />
                    </Field>
                  </div>
                  <div className="flex gap-2 sm:col-span-2">
                    <Button disabled={saveCourse.isPending} type="submit">
                      <Save />
                      {tx("Save course", "حفظ المادة")}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setCourseFormOpen(false);
                        setEditingCourse(null);
                        setCourseForm(emptyCourse);
                      }}
                    >
                      {tx("Cancel", "إلغاء")}
                    </Button>
                  </div>
                </form>
              </Card>
            ) : selected ? (
              <>
                <Card
                  title={selected.name}
                  action={
                    <div className="flex gap-1">
                      <Button size="sm" variant="outline" onClick={() => startCourseEdit(selected)}>
                        <Pencil />
                        {tx("Edit", "تعديل")}
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        aria-label={tx("Delete course", "حذف المادة")}
                        onClick={() => {
                          if (
                            window.confirm(
                              tx(
                                `Delete “${selected.name}”? Related records may prevent deletion.`,
                                `هل تريد حذف «${selected.name}»؟ قد تمنع السجلات المرتبطة الحذف.`,
                              ),
                            )
                          )
                            removeCourse.mutate(selected);
                        }}
                      >
                        <Trash2 className="text-destructive" />
                      </Button>
                    </div>
                  }
                >
                  <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted-foreground">
                    {selected.code && (
                      <span>
                        {tx("Code", "الرمز")}: {selected.code}
                      </span>
                    )}
                    {selected.semester && (
                      <span>
                        {tx("Semester", "الفصل")}: {selected.semester}
                      </span>
                    )}
                    {selected.instructor && (
                      <span>
                        {tx("Instructor", "المدرّس")}: {selected.instructor}
                      </span>
                    )}
                  </div>
                  {selected.description && (
                    <p className="mt-3 whitespace-pre-wrap text-sm">{selected.description}</p>
                  )}
                </Card>
                <Card
                  title={tx("Notes", "الملاحظات")}
                  action={
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setNoteId(null);
                        setNoteTitle("");
                        setNoteContent("");
                      }}
                    >
                      <Plus />
                      {tx("New note", "ملاحظة جديدة")}
                    </Button>
                  }
                >
                  <form onSubmit={submitNote} className="mb-4 grid gap-2 rounded-lg border p-3">
                    <Input
                      aria-label={tx("Note title", "عنوان الملاحظة")}
                      placeholder={tx("Note title", "عنوان الملاحظة")}
                      value={noteTitle}
                      onChange={(e) => setNoteTitle(e.target.value)}
                    />
                    <Textarea
                      aria-label={tx("Write a note…", "اكتب ملاحظة…")}
                      placeholder={tx("Write a note…", "اكتب ملاحظة…")}
                      rows={4}
                      value={noteContent}
                      onChange={(e) => setNoteContent(e.target.value)}
                    />
                    <div className="flex flex-wrap gap-2">
                      <Button size="sm" disabled={saveNote.isPending} type="submit">
                        <Save />
                        {tx(
                          noteId ? "Save changes" : "Save note",
                          noteId ? "حفظ التغييرات" : "حفظ الملاحظة",
                        )}
                      </Button>
                      {noteId && (
                        <Button
                          size="sm"
                          type="button"
                          variant="ghost"
                          onClick={() => {
                            setNoteId(null);
                            setNoteTitle("");
                            setNoteContent("");
                          }}
                        >
                          <X />
                          {tx("Cancel edit", "إلغاء التعديل")}
                        </Button>
                      )}
                    </div>
                  </form>
                  {notesQuery.isLoading ? (
                    <p className="text-sm text-muted-foreground">
                      {tx("Loading notes…", "جارٍ تحميل الملاحظات…")}
                    </p>
                  ) : notesQuery.error ? (
                    <p role="alert" className="text-sm text-destructive">
                      {tx("Could not load notes:", "تعذر تحميل الملاحظات:")}{" "}
                      {notesQuery.error.message}
                    </p>
                  ) : (notesQuery.data?.length ?? 0) === 0 ? (
                    <p className="py-2 text-sm text-muted-foreground">
                      {tx("No saved notes for this course.", "لا توجد ملاحظات محفوظة لهذه المادة.")}
                    </p>
                  ) : (
                    <div className="grid gap-2">
                      {notesQuery.data?.map((note) => (
                        <article key={note.id} className="rounded-lg border p-3">
                          <div className="flex items-start gap-2">
                            <div className="min-w-0 flex-1">
                              <h3 className="font-medium">{note.title}</h3>
                              <p className="mt-1 whitespace-pre-wrap break-words text-sm text-muted-foreground">
                                {note.content}
                              </p>
                              <time className="mt-2 block text-xs text-muted-foreground">
                                {new Date(note.updated_at).toLocaleString(
                                  lang === "ar" ? "ar" : "en",
                                )}
                              </time>
                            </div>
                            <Button
                              size="icon"
                              variant="ghost"
                              aria-label={tx("Edit note", "تعديل الملاحظة")}
                              onClick={() => editNote(note)}
                            >
                              <Pencil />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              aria-label={tx("Delete note", "حذف الملاحظة")}
                              onClick={() => {
                                if (
                                  window.confirm(
                                    tx("Delete this note?", "هل تريد حذف هذه الملاحظة؟"),
                                  )
                                )
                                  removeNote.mutate(note.id);
                              }}
                            >
                              <Trash2 className="text-destructive" />
                            </Button>
                          </div>
                        </article>
                      ))}
                    </div>
                  )}
                </Card>
                <Card
                  title={tx("Files", "الملفات")}
                  action={
                    <label className="inline-flex h-8 cursor-pointer items-center gap-2 rounded-md border border-input px-3 text-xs font-medium hover:bg-accent has-[:disabled]:cursor-not-allowed has-[:disabled]:opacity-50">
                      <Upload className="h-4 w-4" />
                      {fileBusy ? tx("Uploading…", "جارٍ الرفع…") : tx("Upload file", "رفع ملف")}
                      <input
                        type="file"
                        className="sr-only"
                        disabled={fileBusy}
                        onChange={(e) => {
                          void uploadFile(e.target.files?.[0]);
                          e.currentTarget.value = "";
                        }}
                      />
                    </label>
                  }
                >
                  <p className="mb-3 text-xs text-muted-foreground">
                    {tx(
                      "Uploads require an existing course-files Storage bucket and user upload/read policies. If Storage is not configured, the app will explain the setup needed; it will not pretend a file was saved.",
                      "يتطلب الرفع مساحة Storage موجودة باسم يتضمن course وfile وسياسات رفع/قراءة للمستخدم. إذا لم يكن التخزين مضبوطًا فستظهر متطلبات الإعداد، ولن يُعرض الملف على أنه محفوظ.",
                    )}
                  </p>
                  {filesQuery.isLoading ? (
                    <p className="text-sm text-muted-foreground">
                      {tx("Loading files…", "جارٍ تحميل الملفات…")}
                    </p>
                  ) : filesQuery.error ? (
                    <p role="alert" className="text-sm text-destructive">
                      {tx("Could not load file records:", "تعذر تحميل سجلات الملفات:")}{" "}
                      {filesQuery.error.message}
                    </p>
                  ) : (filesQuery.data?.length ?? 0) === 0 ? (
                    <p className="py-2 text-sm text-muted-foreground">
                      {tx("No files recorded for this course.", "لا توجد ملفات مسجلة لهذه المادة.")}
                    </p>
                  ) : (
                    <ul className="grid gap-2">
                      {filesQuery.data?.map((file) => (
                        <li
                          key={file.id}
                          className="flex min-w-0 items-center gap-3 rounded-lg border p-3"
                        >
                          <FileText className="h-5 w-5 shrink-0 text-muted-foreground" />
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-sm font-medium">{file.name}</span>
                            <span className="text-xs text-muted-foreground">
                              {file.size == null ? "" : `${(file.size / 1024).toFixed(1)} KB`}
                            </span>
                          </span>
                          <Button
                            size="icon"
                            variant="ghost"
                            aria-label={tx("Open file", "فتح الملف")}
                            onClick={() => void openFile(file)}
                          >
                            <Download />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            aria-label={tx("Delete file", "حذف الملف")}
                            onClick={() => void deleteFile(file)}
                          >
                            <Trash2 className="text-destructive" />
                          </Button>
                        </li>
                      ))}
                    </ul>
                  )}
                </Card>
              </>
            ) : (
              <Card>
                <div className="py-10 text-center text-sm text-muted-foreground">
                  {tx(
                    "Choose a course or add one to manage its notes and files.",
                    "اختر مادة أو أضف مادة لإدارة ملاحظاتها وملفاتها.",
                  )}
                </div>
              </Card>
            )}
          </div>
        </div>
      )}
    </main>
  );
}
