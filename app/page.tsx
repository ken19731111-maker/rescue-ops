'use client';

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import {
  Wallet,
  Package,
  Clock,
  Send,
  PlusCircle,
  Trash2,
  Download,
  Printer,
  Lock,
  Unlock,
  LogOut,
  Moon,
  Sun,
  Cat,
  Dog,
  Settings,
  BarChart3,
  ShieldCheck,
  Building,
  Play,
  RotateCcw,
  Heart,
  FileSpreadsheet,
  FileText,
} from "lucide-react";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co";
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-key";
const supabase = createClient(supabaseUrl, supabaseKey);

type ActivityLog = {
  id: string;
  created_at: string;
  type: "expense" | "donation";
  title: string;
  amount: number | null;
  details: string | null;
  image_url: string | null;
  status: string;
  volunteer_name: string | null;
  category: string | null;
  animal_id: string | null;
};

type Volunteer = {
  id: string;
  name: string;
  nickname: string | null;
  contact: string | null;
  email: string | null;
  address: string | null;
  notes: string | null;
  role: string | null;
};

type Animal = {
  id: string;
  name: string;
  species: string;
};

const INITIAL_DEMO_ANIMALS: Animal[] = [
  { id: "demo-a1", name: "ミケ（三毛・メス）", species: "cat" },
  { id: "demo-a2", name: "チャチャ（茶トラ・オス）", species: "cat" },
  { id: "demo-a3", name: "クロ（黒猫・オス）", species: "cat" },
];

const INITIAL_DEMO_VOLUNTEERS: Volunteer[] = [
  { id: "demo-v1", name: "佐藤 花子", nickname: "はなこ", contact: "090-0000-1111", email: "hanako@example.com", address: null, notes: "預かり担当", role: "団体管理者" },
  { id: "demo-v2", name: "鈴木 一郎", nickname: "すずき", contact: "090-0000-2222", email: "suzuki@example.com", address: null, notes: "通院・搬送担当", role: "ボランティア" },
  { id: "demo-v3", name: "高橋 美咲", nickname: "みさき", contact: "090-0000-3333", email: "misaki@example.com", address: null, notes: "TNR現場担当", role: "ボランティア" },
];

const getInitialDemoLogs = (): ActivityLog[] => {
  const now = new Date().toISOString();
  return [
    {
      id: "demo-l1",
      created_at: now,
      type: "expense",
      title: "さくら動物病院 避妊手術・ワクチン接種",
      amount: 18500,
      details: "地域猫TNR対象分。領収書あり",
      image_url: null,
      status: "approved",
      volunteer_name: "すずき",
      category: "医療費",
      animal_id: "demo-a1",
    },
    {
      id: "demo-l2",
      created_at: now,
      type: "expense",
      title: "ロイヤルカナン 消化器サポート 2kg×2袋",
      amount: 8400,
      details: "チャチャの療養食用",
      image_url: null,
      status: "approved",
      volunteer_name: "はなこ",
      category: "フード",
      animal_id: "demo-a2",
    },
    {
      id: "demo-l3",
      created_at: now,
      type: "expense",
      title: "システムトイレ用猫砂・ペットシーツまとめ買い",
      amount: 4280,
      details: "シェルター常備用",
      image_url: null,
      status: "pending",
      volunteer_name: "みさき",
      category: "消耗品",
      animal_id: null,
    },
    {
      id: "demo-l4",
      created_at: now,
      type: "expense",
      title: "動物病院への往復ガソリン代・高速代",
      amount: 2100,
      details: "クロの定期検診搬送",
      image_url: null,
      status: "approved",
      volunteer_name: "すずき",
      category: "交通費",
      animal_id: "demo-a3",
    },
    {
      id: "demo-l5",
      created_at: now,
      type: "donation",
      title: "支援者様より子猫用ミルク・ウェットフード寄付",
      amount: 12,
      details: "Amazonほしい物リスト経由",
      image_url: null,
      status: "approved",
      volunteer_name: "はなこ",
      category: "フード",
      animal_id: null,
    },
  ];
};

const CATEGORIES = ["医療費", "フード", "消耗品", "交通費", "その他"] as const;

export default function Home() {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [volunteers, setVolunteers] = useState<Volunteer[]>([]);
  const [animals, setAnimals] = useState<Animal[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // 🎮 デモモード状態
  const [isDemoMode, setIsDemoMode] = useState(false);

  // 🌙 ダークモード
  const [darkMode, setDarkMode] = useState(false);

  // ⚙️ 設定・管理パネル
  const [showSettings, setShowSettings] = useState(false);

  // 🖨️ 領収書添付台紙の印刷モード
  const [isPrintReceiptSheet, setIsPrintReceiptSheet] = useState(false);

  // 新規ボランティア追加用
  const [newVolName, setNewVolName] = useState("");
  const [newVolNickname, setNewVolNickname] = useState("");
  const [newVolContact, setNewVolContact] = useState("");

  // 新規動物追加用
  const [newAnimalName, setNewAnimalName] = useState("");
  const [newAnimalSpecies, setNewAnimalSpecies] = useState("cat");

  // 認証 & 権限の状態
  const [user, setUser] = useState<any>(null);
  const [userOrgId, setUserOrgId] = useState<string | null>(null);
  const [userOrgName, setUserOrgName] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [isSignUpMode, setIsSignUpMode] = useState(false);

  // ログイン・登録フォーム用ステート
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [regOrgName, setRegOrgName] = useState("");
  const [regOrgSlug, setRegOrgSlug] = useState("");
  const [regAdminName, setRegAdminName] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);

  // メイン画面のタブ切り替え
  const [activeTab, setActiveTab] = useState<"logs" | "summary">("logs");

  // フォーム状態
  const [type, setType] = useState<"expense" | "donation">("expense");
  const [volunteerName, setVolunteerName] = useState("匿名");
  const [category, setCategory] = useState("医療費");
  const [animalId, setAnimalId] = useState("");
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [details, setDetails] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);

  // フィルター
  const [filter, setFilter] = useState<"all" | "expense" | "donation" | "pending">("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");

  // 助成金集計用の対象期間
  const [reportPeriod, setReportPeriod] = useState<string>("all");
  const [selectedMonth, setSelectedMonth] = useState<string>("");

  useEffect(() => {
    setSelectedMonth(new Date().toISOString().slice(0, 7));
  }, []);

  const startDemoMode = () => {
    setIsDemoMode(true);
    setUserOrgId("demo-org-id");
    setUserOrgName("サンプル保護猫ボランティア（体験デモ）");
    setUserRole("org_admin");
    setLogs(getInitialDemoLogs());
    setVolunteers(INITIAL_DEMO_VOLUNTEERS);
    setAnimals(INITIAL_DEMO_ANIMALS);
    setVolunteerName("はなこ");
    setLoading(false);
  };

  const exitDemoMode = () => {
    setIsDemoMode(false);
    setUserOrgId(null);
    setUserOrgName(null);
    setUserRole(null);
    setShowSettings(false);
    setLogs([]);
    setVolunteers([]);
    setAnimals([]);
  };

  const checkUserPermission = async (currentUser: any) => {
    if (!currentUser) {
      setUserRole(null);
      setUserOrgId(null);
      setUserOrgName(null);
      return;
    }

    const { data: profileData } = await supabase
      .from("profiles")
      .select("role, organization_id")
      .eq("id", currentUser.id)
      .maybeSingle();

    if (profileData) {
      setUserRole(profileData.role);
      setUserOrgId(profileData.organization_id);

      if (profileData.organization_id) {
        const { data: orgData } = await supabase
          .from("organizations")
          .select("name")
          .eq("id", profileData.organization_id)
          .maybeSingle();
        if (orgData) setUserOrgName(orgData.name);
      }
    } else {
      setUserRole("volunteer");
    }
  };

  useEffect(() => {
    const savedTheme = localStorage.getItem("rescueops_theme");
    if (savedTheme === "dark") setDarkMode(true);

    const cachedVolunteer = localStorage.getItem("rescueops_last_volunteer");
    if (cachedVolunteer) setVolunteerName(cachedVolunteer);

    supabase.auth.getSession().then(({ data: { session } }) => {
      const sessionUser = session?.user ?? null;
      setUser(sessionUser);
      checkUserPermission(sessionUser);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      const sessionUser = session?.user ?? null;
      setUser(sessionUser);
      checkUserPermission(sessionUser);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (isDemoMode) return;
    if (userOrgId) {
      fetchInitialData();
    } else {
      setLoading(false);
    }
  }, [userOrgId, isDemoMode]);

  const toggleDarkMode = () => {
    const nextMode = !darkMode;
    setDarkMode(nextMode);
    localStorage.setItem("rescueops_theme", nextMode ? "dark" : "light");
  };

  const fetchInitialData = async () => {
    setLoading(true);
    await Promise.all([fetchLogs(), fetchVolunteers(), fetchAnimals()]);
    setLoading(false);
  };

  const fetchLogs = async () => {
    if (!userOrgId || isDemoMode) return;
    const { data, error } = await supabase
      .from("activity_logs")
      .select("*")
      .eq("organization_id", userOrgId)
      .order("created_at", { ascending: false });
    if (!error) setLogs(data || []);
  };

  const fetchVolunteers = async () => {
    if (!userOrgId || isDemoMode) return;
    const { data } = await supabase
      .from("volunteers")
      .select("*")
      .eq("organization_id", userOrgId)
      .order("name");
    if (data) setVolunteers(data);
  };

  const fetchAnimals = async () => {
    if (!userOrgId || isDemoMode) return;
    const { data } = await supabase
      .from("animals")
      .select("*")
      .eq("organization_id", userOrgId)
      .order("name");
    if (data) setAnimals(data);
  };

  const handleAddVolunteer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newVolName.trim() || !userOrgId) return;

    if (isDemoMode) {
      const newVol: Volunteer = {
        id: `demo-v-${Date.now()}`,
        name: newVolName.trim(),
        nickname: newVolNickname.trim() || newVolName.trim(),
        contact: newVolContact.trim() || null,
        email: null,
        address: null,
        notes: null,
        role: "ボランティア",
      };
      setVolunteers((prev) => [...prev, newVol]);
      setNewVolName("");
      setNewVolNickname("");
      setNewVolContact("");
      return;
    }

    const { error } = await supabase.from("volunteers").insert([
      {
        organization_id: userOrgId,
        name: newVolName.trim(),
        nickname: newVolNickname.trim() || newVolName.trim(),
        contact: newVolContact.trim() || null,
        role: "ボランティア",
      },
    ]);
    if (error) {
      alert("追加に失敗しました: " + error.message);
    } else {
      setNewVolName("");
      setNewVolNickname("");
      setNewVolContact("");
      fetchVolunteers();
    }
  };

  const handleAddAnimal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAnimalName.trim() || !userOrgId) return;

    if (isDemoMode) {
      const newAnim: Animal = {
        id: `demo-a-${Date.now()}`,
        name: newAnimalName.trim(),
        species: newAnimalSpecies,
      };
      setAnimals((prev) => [...prev, newAnim]);
      setNewAnimalName("");
      return;
    }

    const { error } = await supabase.from("animals").insert([
      { organization_id: userOrgId, name: newAnimalName.trim(), species: newAnimalSpecies },
    ]);
    if (error) {
      alert("追加に失敗しました: " + error.message);
    } else {
      setNewAnimalName("");
      fetchAnimals();
    }
  };

  const handleDeleteVolunteer = async (id: string, name: string) => {
    if (!confirm(`本当に「${name}」さんを名簿から削除しますか？`)) return;
    if (isDemoMode) {
      setVolunteers((prev) => prev.filter((v) => v.id !== id));
      return;
    }
    await supabase.from("volunteers").delete().eq("id", id);
    fetchVolunteers();
  };

  const handleDeleteAnimal = async (id: string) => {
    if (!confirm("この保護動物を削除してもよろしいですか？")) return;
    if (isDemoMode) {
      setAnimals((prev) => prev.filter((a) => a.id !== id));
      return;
    }
    await supabase.from("animals").delete().eq("id", id);
    fetchAnimals();
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      alert("ログイン失敗: " + error.message);
    } else {
      if (isDemoMode) exitDemoMode();
      setEmail("");
      setPassword("");
      setShowLoginModal(false);
    }
    setLoginLoading(false);
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regOrgName.trim() || !regOrgSlug.trim() || !regAdminName.trim()) {
      alert("すべての項目を入力してください。");
      return;
    }

    setLoginLoading(true);
    const cleanSlug = regOrgSlug.trim().toLowerCase().replace(/[^a-z0-9-_]/g, "");

    const { data: existingOrg } = await supabase
      .from("organizations")
      .select("id")
      .eq("slug", cleanSlug)
      .maybeSingle();

    if (existingOrg) {
      alert(`⚠️ 団体URL「${cleanSlug}」はすでに使用されています。\n他のURLスラッグに変更してください。`);
      setLoginLoading(false);
      return;
    }

    const { data: authData, error: authError } = await supabase.auth.signUp({ email, password });
    if (authError || !authData.user) {
      alert("アカウント作成失敗: " + (authError?.message || "不明なエラー"));
      setLoginLoading(false);
      return;
    }

    const newUser = authData.user;

    const { data: orgData, error: orgError } = await supabase
      .from("organizations")
      .insert([{ name: regOrgName.trim(), slug: cleanSlug }])
      .select()
      .single();

    if (orgError || !orgData) {
      alert("団体の作成に失敗しました: " + orgError?.message);
      setLoginLoading(false);
      return;
    }

    const newOrgId = orgData.id;

    await supabase.from("profiles").upsert([
      { id: newUser.id, role: "org_admin", organization_id: newOrgId },
    ]);

    await supabase.from("volunteers").insert([
      {
        organization_id: newOrgId,
        name: regAdminName.trim(),
        nickname: regAdminName.trim(),
        email: email.trim(),
        role: "団体管理者",
      },
    ]);

    alert("🎉 団体の登録とアカウント作成が完了しました！");
    setEmail("");
    setPassword("");
    setRegOrgName("");
    setRegOrgSlug("");
    setRegAdminName("");
    setIsSignUpMode(false);
    setShowLoginModal(false);
    setLoginLoading(false);
    window.location.reload();
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setLogs([]);
    setVolunteers([]);
    setAnimals([]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !userOrgId) return;

    setSubmitting(true);
    const newAmount = amount ? Number(amount) : null;
    const selectedAnimalId = animalId ? animalId : null;
    const finalVolunteerName = volunteerName.trim() || "匿名";

    if (isDemoMode) {
      const demoNewLog: ActivityLog = {
        id: `demo-l-${Date.now()}`,
        created_at: new Date().toISOString(),
        type,
        volunteer_name: finalVolunteerName,
        category,
        animal_id: selectedAnimalId,
        title: title.trim(),
        amount: newAmount,
        details: details.trim() || null,
        image_url: imageFile ? URL.createObjectURL(imageFile) : null,
        status: "pending",
      };
      setLogs((prev) => [demoNewLog, ...prev]);
      setTitle("");
      setAmount("");
      setDetails("");
      setImageFile(null);
      const fileInput = document.getElementById("image-input") as HTMLInputElement;
      if (fileInput) fileInput.value = "";
      setSubmitting(false);
      return;
    }

    let uploadedImageUrl: string | null = null;

    if (imageFile) {
      const fileExt = imageFile.name.split(".").pop();
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `uploads/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("activity-images")
        .upload(filePath, imageFile);

      if (uploadError) {
        alert("画像アップロード失敗: " + uploadError.message);
        setSubmitting(false);
        return;
      }

      const { data: publicUrlData } = supabase.storage
        .from("activity-images")
        .getPublicUrl(filePath);

      uploadedImageUrl = publicUrlData.publicUrl;
    }

    localStorage.setItem("rescueops_last_volunteer", finalVolunteerName);

    const { error } = await supabase.from("activity_logs").insert([
      {
        organization_id: userOrgId,
        type,
        volunteer_name: finalVolunteerName,
        category,
        animal_id: selectedAnimalId,
        title,
        amount: newAmount,
        details,
        image_url: uploadedImageUrl,
        status: "pending",
      },
    ]);

    if (error) {
      alert("送信失敗: " + error.message);
    } else {
      setTitle("");
      setAmount("");
      setDetails("");
      setImageFile(null);
      const fileInput = document.getElementById("image-input") as HTMLInputElement;
      if (fileInput) fileInput.value = "";
      fetchLogs();
    }
    setSubmitting(false);
  };

  const handleStatusChange = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === "approved" ? "pending" : "approved";
    if (isDemoMode) {
      setLogs((prev) => prev.map((l) => (l.id === id ? { ...l, status: newStatus } : l)));
      return;
    }
    await supabase.from("activity_logs").update({ status: newStatus }).eq("id", id);
    fetchLogs();
  };

  const handleDelete = async (id: string, logTitle: string) => {
    if (!confirm(`「${logTitle}」を削除しますか？`)) return;
    if (isDemoMode) {
      setLogs((prev) => prev.filter((l) => l.id !== id));
      return;
    }
    await supabase.from("activity_logs").delete().eq("id", id);
    fetchLogs();
  };

  const exportToCSV = () => {
    if (filteredLogs.length === 0) {
      alert("データがありません。");
      return;
    }

    const headers = ["ID", "日時", "申請者/愛称", "種別", "カテゴリ", "対象動物", "項目名", "金額/数量", "詳細", "ステータス"];
    const rows = filteredLogs.map((log) => {
      const animalObj = animals.find((a) => a.id === log.animal_id);
      return [
        log.id,
        new Date(log.created_at).toLocaleString("ja-JP"),
        `"${log.volunteer_name || ""}"`,
        log.type === "expense" ? "経費精算" : "物資寄付",
        `"${log.category || ""}"`,
        `"${animalObj ? animalObj.name : "共通・指定なし"}"`,
        `"${log.title.replace(/"/g, '""')}"`,
        log.amount ?? "",
        `"${(log.details || "").replace(/"/g, '""')}"`,
        log.status === "approved" ? "承認済み" : "確認待ち",
      ];
    });

    const csvContent = "\uFEFF" + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `RescueOps_GrantReport_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  const filteredLogs = logs.filter((log) => {
    if (filter === "expense" && log.type !== "expense") return false;
    if (filter === "donation" && log.type !== "donation") return false;
    if (filter === "pending" && log.status !== "pending") return false;
    if (categoryFilter !== "all" && log.category !== categoryFilter) return false;
    return true;
  });

  const reportLogs = logs.filter((log) => {
    if (reportPeriod === "month" && selectedMonth) {
      return log.created_at.startsWith(selectedMonth);
    }
    return true;
  });

  const reportExpenses = reportLogs.filter((l) => l.type === "expense");
  const approvedExpenseTotal = reportExpenses
    .filter((l) => l.status === "approved")
    .reduce((sum, l) => sum + (l.amount || 0), 0);
  const pendingExpenseTotal = reportExpenses
    .filter((l) => l.status === "pending")
    .reduce((sum, l) => sum + (l.amount || 0), 0);
  const totalDonationItems = reportLogs
    .filter((l) => l.type === "donation")
    .reduce((sum, l) => sum + (l.amount || 0), 0);

  const categoryStats = CATEGORIES.map((cat) => {
    const items = reportExpenses.filter((l) => (l.category || "その他") === cat);
    const approved = items.filter((l) => l.status === "approved").reduce((s, l) => s + (l.amount || 0), 0);
    const pending = items.filter((l) => l.status === "pending").reduce((s, l) => s + (l.amount || 0), 0);
    return {
      category: cat,
      count: items.length,
      approved,
      pending,
      total: approved + pending,
    };
  });

  const animalStats = animals.map((animal) => {
    const items = reportExpenses.filter((l) => l.animal_id === animal.id);
    const medical = items
      .filter((l) => l.category === "医療費")
      .reduce((s, l) => s + (l.amount || 0), 0);
    const other = items
      .filter((l) => l.category !== "医療費")
      .reduce((s, l) => s + (l.amount || 0), 0);
    return {
      ...animal,
      count: items.length,
      medical,
      other,
      total: medical + other,
    };
  });

  const unassignedExpenseTotal = reportExpenses
    .filter((l) => !l.animal_id)
    .reduce((s, l) => s + (l.amount || 0), 0);

  const isAdmin = userRole === "admin" || userRole === "org_admin";

  // 🖨️ 領収書添付台紙の印刷モード専用レイアウト
  if (isPrintReceiptSheet) {
    const approvedExpenses = logs.filter((l) => l.type === "expense" && l.status === "approved");
    return (
      <div className="min-h-screen bg-white text-slate-900 p-8 font-sans">
        <div className="max-w-3xl mx-auto space-y-6">
          {/* 印刷操作バー（印刷時は非表示） */}
          <div className="flex justify-between items-center bg-slate-100 p-4 rounded-xl print:hidden border border-slate-200">
            <div>
              <h2 className="text-sm font-bold text-slate-800">🖨️ 領収書・レシート添付台紙（印刷プレビュー）</h2>
              <p className="text-xs text-slate-500">ブラウザの印刷機能から「PDFとして保存」または印刷を行ってください。</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => window.print()}
                className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold shadow-sm hover:bg-indigo-500"
              >
                印刷 / PDF保存
              </button>
              <button
                onClick={() => setIsPrintReceiptSheet(false)}
                className="px-4 py-2 bg-slate-300 text-slate-800 rounded-xl text-xs font-bold hover:bg-slate-400"
              >
                閉じる
              </button>
            </div>
          </div>

          {/* A4台紙本体 */}
          <div className="border-2 border-slate-800 p-8 space-y-6 bg-white">
            <div className="text-center border-b-2 border-slate-800 pb-4">
              <h1 className="text-xl font-black tracking-wider">領収書・レシート貼付台紙</h1>
              <p className="text-xs text-slate-600 mt-1">
                団体名：<strong>{userOrgName || "保護猫・動物愛護団体"}</strong> ｜ 対象期間：{reportPeriod === "month" ? selectedMonth : "全期間累計"}
              </p>
            </div>

            <div className="space-y-4">
              <table className="w-full text-left text-xs border-collapse border border-slate-400">
                <thead>
                  <tr className="bg-slate-100 text-slate-800">
                    <th className="border border-slate-400 p-2">日付</th>
                    <th className="border border-slate-400 p-2">科目</th>
                    <th className="border border-slate-400 p-2">支払先・内容</th>
                    <th className="border border-slate-400 p-2">対象動物</th>
                    <th className="border border-slate-400 p-2">申請者</th>
                    <th className="border border-slate-400 p-2 text-right">金額 (円)</th>
                  </tr>
                </thead>
                <tbody>
                  {approvedExpenses.map((exp) => {
                    const anim = animals.find((a) => a.id === exp.animal_id);
                    return (
                      <tr key={exp.id}>
                        <td className="border border-slate-400 p-2">{new Date(exp.created_at).toLocaleDateString("ja-JP")}</td>
                        <td className="border border-slate-400 p-2 font-semibold">{exp.category || "その他"}</td>
                        <td className="border border-slate-400 p-2">{exp.title}</td>
                        <td className="border border-slate-400 p-2">{anim ? anim.name : "-"}</td>
                        <td className="border border-slate-400 p-2">{exp.volunteer_name}</td>
                        <td className="border border-slate-400 p-2 text-right font-bold">¥{(exp.amount || 0).toLocaleString()}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              <div className="flex justify-end pt-2">
                <div className="border border-slate-800 px-6 py-2 bg-slate-50 text-sm font-black">
                  承認済み経費 総計: ¥{approvedExpenseTotal.toLocaleString()}
                </div>
              </div>
            </div>

            {/* レシート貼付エリア */}
            <div className="border-t-2 border-dashed border-slate-400 pt-6 space-y-4">
              <h3 className="text-xs font-bold text-slate-700">【領収書・レシート貼付スペース】</h3>
              <div className="grid grid-cols-2 gap-4">
                {approvedExpenses.map((exp, idx) => (
                  <div key={exp.id} className="border border-slate-400 p-3 h-48 flex flex-col justify-between bg-slate-50/50">
                    <div className="text-[10px] font-bold text-slate-600">
                      #{idx + 1} {exp.title} (¥{(exp.amount || 0).toLocaleString()})
                    </div>
                    {exp.image_url ? (
                      <img src={exp.image_url} alt="レシート" className="max-h-32 object-contain mx-auto" />
                    ) : (
                      <div className="text-center text-[10px] text-slate-400 my-auto">
                        [ここにレシートを貼付 または デジタル画像添付]
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 pt-8 text-xs font-semibold">
              <div>代表者確認印： _______________________</div>
              <div className="text-right">経理担当確認印： _______________________</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`min-h-screen transition-colors duration-300 p-4 md:p-8 relative ${
        darkMode ? "bg-slate-950 text-slate-100" : "bg-slate-50 text-slate-800"
      }`}
    >
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* 🎮 デモモード案内バナー */}
        {isDemoMode && (
          <div className="rounded-2xl p-3.5 bg-amber-500/15 border border-amber-500/40 flex flex-col sm:flex-row items-center justify-between gap-3 print:hidden">
            <div className="flex items-center gap-2 text-xs font-semibold text-amber-500">
              <Play className="w-4 h-4 fill-current shrink-0" />
              <span>
                <strong>体験デモモード中：</strong> 入力や承認を自由にお試しいただけます。ページを閉じるか「デモ終了」でリセットされます。
              </span>
            </div>
            <button
              onClick={exitDemoMode}
              className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold flex items-center gap-1 shrink-0 transition-all"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              デモ終了
            </button>
          </div>
        )}

        {/* ヘッダー */}
        <header
          className={`rounded-2xl p-6 shadow-sm border transition-colors print:border-none print:shadow-none print:p-2 ${
            darkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-100"
          } flex flex-col sm:flex-row sm:items-center justify-between gap-4`}
        >
          <div className="flex items-center gap-3">
            <div className="p-3 bg-amber-500/10 rounded-2xl border border-amber-500/20 text-amber-500 flex items-center gap-1.5 print:hidden">
              <Cat className="w-6 h-6" />
              <Dog className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight flex items-center gap-2 flex-wrap">
                RescueOps
                {userOrgName && (
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                    🏢 {userOrgName}
                  </span>
                )}
              </h1>
              <p className={`text-xs mt-0.5 ${darkMode ? "text-slate-400" : "text-slate-500"}`}>
                動物保護活動・助成金報告サポートプラットフォーム
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap print:hidden">
            {isAdmin && (
              <button
                onClick={() => setShowSettings(!showSettings)}
                title="名簿・保護動物の管理"
                className={`px-3 py-2 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all ${
                  showSettings
                    ? "bg-indigo-600 border-indigo-500 text-white"
                    : darkMode
                    ? "bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700"
                    : "bg-slate-100 border-slate-200 text-slate-600 hover:bg-slate-200"
                }`}
              >
                <Settings className="w-4 h-4" />
                名簿・保護動物管理
              </button>
            )}

            <button
              onClick={() => setIsPrintReceiptSheet(true)}
              className={`px-3 py-2 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm ${
                darkMode ? "bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700" : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
              }`}
            >
              <FileText className="w-4 h-4 text-emerald-500" />
              領収書台紙 印刷
            </button>

            <button
              onClick={toggleDarkMode}
              className={`p-2.5 rounded-xl border transition-all ${
                darkMode
                  ? "bg-slate-800 border-slate-700 text-amber-400 hover:bg-slate-700"
                  : "bg-slate-100 border-slate-200 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            <button
              onClick={exportToCSV}
              className={`px-3 py-2 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm ${
                darkMode ? "bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700" : "bg-white border-slate-200 text-slate-700"
              }`}
            >
              <Download className="w-4 h-4 text-indigo-500" />
              CSV出力
            </button>

            {user ? (
              <div className="flex items-center gap-2">
                <span className="bg-emerald-500/10 text-emerald-500 text-xs font-semibold px-3 py-2 rounded-xl border border-emerald-500/20 flex items-center gap-1">
                  <Unlock className="w-3 h-3" />
                  {userRole === "admin" ? "サイト管理者" : "団体管理者"}
                </span>
                <button
                  onClick={handleLogout}
                  className={`px-3 py-2 rounded-xl border text-xs font-semibold flex items-center gap-1 transition-all ${
                    darkMode ? "bg-slate-800 border-slate-700 text-slate-300" : "bg-slate-100 border-slate-200"
                  }`}
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              !isDemoMode && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={startDemoMode}
                    className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    デモ体験
                  </button>
                  <button
                    onClick={() => {
                      setIsSignUpMode(false);
                      setShowLoginModal(true);
                    }}
                    className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm"
                  >
                    <Lock className="w-3.5 h-3.5" />
                    ログイン / 団体登録
                  </button>
                </div>
              )
            )}
          </div>
        </header>

        {/* ⚙️ 管理者専用パネル */}
        {showSettings && isAdmin && (
          <section
            className={`rounded-2xl p-5 border shadow-sm space-y-6 transition-all print:hidden ${
              darkMode ? "bg-slate-900/90 border-indigo-500/30" : "bg-indigo-50/50 border-indigo-200"
            }`}
          >
            <div className="space-y-3">
              <h3 className="text-sm font-bold flex items-center gap-2 text-indigo-500">
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                ボランティア名簿の管理 ({volunteers.length}名)
              </h3>

              <div className="overflow-x-auto rounded-xl border border-slate-700/40">
                <table className="w-full text-left text-xs">
                  <thead className={darkMode ? "bg-slate-800 text-slate-300" : "bg-indigo-100 text-indigo-900"}>
                    <tr>
                      <th className="p-2.5">氏名</th>
                      <th className="p-2.5">愛称</th>
                      <th className="p-2.5">連絡先</th>
                      <th className="p-2.5 text-center">操作</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700/30">
                    {volunteers.map((vol) => (
                      <tr key={vol.id} className={darkMode ? "hover:bg-slate-800/50" : "hover:bg-white"}>
                        <td className="p-2.5 font-bold">{vol.name}</td>
                        <td className="p-2.5 text-indigo-400 font-semibold">{vol.nickname || "-"}</td>
                        <td className="p-2.5 opacity-80">{vol.contact || "-"}</td>
                        <td className="p-2.5 text-center">
                          <button
                            onClick={() => handleDeleteVolunteer(vol.id, vol.name)}
                            className="px-2.5 py-1 rounded-lg bg-rose-500/10 text-rose-500 hover:bg-rose-500/20 text-[10px] font-bold"
                          >
                            削除
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <form onSubmit={handleAddVolunteer} className={`p-3.5 rounded-xl border space-y-2.5 ${darkMode ? "bg-slate-800/60 border-slate-700" : "bg-white border-indigo-100"}`}>
                <p className="text-xs font-bold text-indigo-400">＋ ボランティアを名簿に追加</p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <input
                    type="text"
                    required
                    placeholder="氏名（必須）"
                    value={newVolName}
                    onChange={(e) => setNewVolName(e.target.value)}
                    className={`px-3 py-2 rounded-xl border text-xs ${darkMode ? "bg-slate-900 border-slate-700 text-white" : "bg-slate-50 border-slate-200"}`}
                  />
                  <input
                    type="text"
                    placeholder="愛称（申請時に表示）"
                    value={newVolNickname}
                    onChange={(e) => setNewVolNickname(e.target.value)}
                    className={`px-3 py-2 rounded-xl border text-xs ${darkMode ? "bg-slate-900 border-slate-700 text-white" : "bg-slate-50 border-slate-200"}`}
                  />
                  <input
                    type="text"
                    placeholder="連絡先（任意）"
                    value={newVolContact}
                    onChange={(e) => setNewVolContact(e.target.value)}
                    className={`px-3 py-2 rounded-xl border text-xs ${darkMode ? "bg-slate-900 border-slate-700 text-white" : "bg-slate-50 border-slate-200"}`}
                  />
                </div>
                <button type="submit" className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow-sm">
                  名簿に追加登録する
                </button>
              </form>
            </div>

            <div className="space-y-3 pt-2 border-t border-slate-700/30">
              <h3 className="text-sm font-bold flex items-center gap-2 text-amber-500">
                <Heart className="w-4 h-4" />
                保護動物（個体別集計用）の管理 ({animals.length}頭)
              </h3>

              <div className="flex flex-wrap gap-2">
                {animals.map((anim) => (
                  <div
                    key={anim.id}
                    className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-2 ${
                      darkMode ? "bg-slate-800 border-slate-700" : "bg-white border-slate-200"
                    }`}
                  >
                    <span>{anim.species === "dog" ? "🐶" : "🐱"} {anim.name}</span>
                    <button
                      onClick={() => handleDeleteAnimal(anim.id)}
                      className="text-rose-400 hover:text-rose-500 font-bold"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>

              <form onSubmit={handleAddAnimal} className="flex flex-col sm:flex-row gap-2">
                <select
                  value={newAnimalSpecies}
                  onChange={(e) => setNewAnimalSpecies(e.target.value)}
                  className={`px-3 py-2 rounded-xl border text-xs ${darkMode ? "bg-slate-800 border-slate-700 text-white" : "bg-white border-slate-200"}`}
                >
                  <option value="cat">🐱 猫</option>
                  <option value="dog">🐶 犬</option>
                </select>
                <input
                  type="text"
                  required
                  placeholder="保護動物の名前（例: ミケちゃん・TNR1号）"
                  value={newAnimalName}
                  onChange={(e) => setNewAnimalName(e.target.value)}
                  className={`flex-1 px-3 py-2 rounded-xl border text-xs ${darkMode ? "bg-slate-800 border-slate-700 text-white" : "bg-white border-slate-200"}`}
                />
                <button type="submit" className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold rounded-xl">
                  保護動物を登録
                </button>
              </form>
            </div>
          </section>
        )}

        {/* 📝 新規申請フォーム */}
        {userOrgId && (
          <section className={`rounded-2xl p-6 border shadow-sm print:hidden ${darkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-100"}`}>
            <h2 className="text-base font-bold mb-4 flex items-center gap-2">
              <PlusCircle className="w-5 h-5 text-indigo-500" />
              新規申請フォーム（経費精算・物資寄付）
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setType("expense")}
                  className={`py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 border transition-all ${
                    type === "expense"
                      ? "bg-indigo-600 border-indigo-500 text-white shadow-sm"
                      : darkMode ? "bg-slate-800 border-slate-700 text-slate-400" : "bg-slate-100 border-slate-200 text-slate-600"
                  }`}
                >
                  <Wallet className="w-4 h-4" />
                  経費精算（立替）
                </button>
                <button
                  type="button"
                  onClick={() => setType("donation")}
                  className={`py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 border transition-all ${
                    type === "donation"
                      ? "bg-amber-600 border-amber-500 text-white shadow-sm"
                      : darkMode ? "bg-slate-800 border-slate-700 text-slate-400" : "bg-slate-100 border-slate-200 text-slate-600"
                  }`}
                >
                  <Package className="w-4 h-4" />
                  物資寄付
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-1">申請者（愛称を選択）</label>
                  <select
                    value={volunteerName}
                    onChange={(e) => setVolunteerName(e.target.value)}
                    className={`w-full px-3 py-2 rounded-xl border text-xs ${darkMode ? "bg-slate-800 border-slate-700 text-white" : "bg-slate-50 border-slate-200"}`}
                  >
                    <option value="匿名">匿名</option>
                    {volunteers.map((v) => (
                      <option key={v.id} value={v.nickname || v.name}>
                        {v.nickname || v.name} ({v.name})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1">助成金区分（カテゴリ）</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className={`w-full px-3 py-2 rounded-xl border text-xs ${darkMode ? "bg-slate-800 border-slate-700 text-white" : "bg-slate-50 border-slate-200"}`}
                  >
                    <option value="医療費">医療費・通院</option>
                    <option value="フード">フード・おやつ</option>
                    <option value="消耗品">砂・シーツ等の消耗品</option>
                    <option value="交通費">交通費・ガソリン代</option>
                    <option value="その他">その他</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1">対象動物（任意）</label>
                  <select
                    value={animalId}
                    onChange={(e) => setAnimalId(e.target.value)}
                    className={`w-full px-3 py-2 rounded-xl border text-xs ${darkMode ? "bg-slate-800 border-slate-700 text-white" : "bg-slate-50 border-slate-200"}`}
                  >
                    <option value="">共通・指定なし</option>
                    {animals.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.species === "dog" ? "🐶" : "🐱"} {a.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1">項目名・支払先（必須）</label>
                <input
                  type="text"
                  required
                  placeholder="例: ○○動物病院 血液検査・ワクチン代"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className={`w-full px-3 py-2 rounded-xl border text-xs ${darkMode ? "bg-slate-800 border-slate-700 text-white" : "bg-slate-50 border-slate-200"}`}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold mb-1">{type === "expense" ? "金額 (円)" : "数量 (点)"}</label>
                  <input
                    type="number"
                    placeholder={type === "expense" ? "例: 3500" : "例: 2"}
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className={`w-full px-3 py-2 rounded-xl border text-xs ${darkMode ? "bg-slate-800 border-slate-700 text-white" : "bg-slate-50 border-slate-200"}`}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">レシート画像</label>
                  <input
                    id="image-input"
                    type="file"
                    accept="image/*"
                    onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                    className="w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-600"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-sm flex items-center justify-center gap-2"
              >
                <Send className="w-4 h-4" />
                {submitting ? "送信中..." : "申請を送信する"}
              </button>
            </form>
          </section>
        )}

        {/* 🔄 メインタブ切り替え */}
        {userOrgId && (
          <div className="flex gap-2 border-b border-slate-700/30 pb-2 print:hidden">
            <button
              onClick={() => setActiveTab("logs")}
              className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
                activeTab === "logs"
                  ? "bg-indigo-600 text-white shadow-sm"
                  : darkMode
                  ? "bg-slate-900 text-slate-400 hover:text-white"
                  : "bg-white text-slate-600 hover:bg-slate-100"
              }`}
            >
              <Clock className="w-4 h-4" />
              活動ログ・承認一覧 ({logs.length})
            </button>
            <button
              onClick={() => setActiveTab("summary")}
              className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
                activeTab === "summary"
                  ? "bg-emerald-600 text-white shadow-sm"
                  : darkMode
                  ? "bg-slate-900 text-slate-400 hover:text-white"
                  : "bg-white text-slate-600 hover:bg-slate-100"
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              助成金・収支レポート（自動集計）
            </button>
          </div>
        )}

        {/* 📊 タブ2：助成金レポートダッシュボード */}
        {userOrgId && activeTab === "summary" && (
          <section className="space-y-6">
            <div className={`p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 print:hidden ${darkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-100"}`}>
              <div className="flex items-center gap-2 text-xs font-bold">
                <FileSpreadsheet className="w-4 h-4 text-emerald-500" />
                <span>集計対象期間：</span>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={() => setReportPeriod("all")}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold border ${
                    reportPeriod === "all"
                      ? "bg-emerald-600 border-emerald-500 text-white"
                      : darkMode ? "bg-slate-800 border-slate-700 text-slate-400" : "bg-slate-100 border-slate-200 text-slate-600"
                  }`}
                >
                  全期間（年度累計）
                </button>
                <button
                  onClick={() => setReportPeriod("month")}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold border ${
                    reportPeriod === "month"
                      ? "bg-emerald-600 border-emerald-500 text-white"
                      : darkMode ? "bg-slate-800 border-slate-700 text-slate-400" : "bg-slate-100 border-slate-200 text-slate-600"
                  }`}
                >
                  月別指定
                </button>
                {reportPeriod === "month" && (
                  <input
                    type="month"
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(e.target.value)}
                    className={`px-3 py-1.5 rounded-xl border text-xs ${darkMode ? "bg-slate-800 border-slate-700 text-white" : "bg-slate-50 border-slate-200"}`}
                  />
                )}
                <button
                  onClick={() => setIsPrintReceiptSheet(true)}
                  className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm"
                >
                  <FileText className="w-3.5 h-3.5" />
                  領収書台紙を印刷する
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className={`p-5 rounded-2xl border ${darkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-100"}`}>
                <p className="text-xs font-semibold text-emerald-500">✔ 承認済み経費合計（助成対象確定）</p>
                <p className="text-2xl font-black mt-1">¥{approvedExpenseTotal.toLocaleString()}</p>
              </div>
              <div className={`p-5 rounded-2xl border ${darkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-100"}`}>
                <p className="text-xs font-semibold text-amber-500">⏳ 確認待ち経費（未承認分）</p>
                <p className="text-2xl font-black mt-1">¥{pendingExpenseTotal.toLocaleString()}</p>
              </div>
              <div className={`p-5 rounded-2xl border ${darkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-100"}`}>
                <p className="text-xs font-semibold text-indigo-400">📦 受領した支援物資</p>
                <p className="text-2xl font-black mt-1">{totalDonationItems.toLocaleString()} 点</p>
              </div>
            </div>

            <div className={`p-5 rounded-2xl border space-y-4 ${darkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-100"}`}>
              <div>
                <h3 className="text-sm font-bold flex items-center gap-2">
                  📑 助成金区分（カテゴリ）別 支出内訳
                </h3>
              </div>

              <div className="overflow-x-auto rounded-xl border border-slate-700/30">
                <table className="w-full text-left text-xs">
                  <thead className={darkMode ? "bg-slate-800 text-slate-300" : "bg-slate-100 text-slate-700"}>
                    <tr>
                      <th className="p-3">経費科目（カテゴリ）</th>
                      <th className="p-3 text-right">件数</th>
                      <th className="p-3 text-right">承認済み金額</th>
                      <th className="p-3 text-right">確認待ち</th>
                      <th className="p-3 text-right">合計</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700/20">
                    {categoryStats.map((stat) => (
                      <tr key={stat.category}>
                        <td className="p-3 font-bold">{stat.category}</td>
                        <td className="p-3 text-right">{stat.count}件</td>
                        <td className="p-3 text-right font-bold text-emerald-500">¥{stat.approved.toLocaleString()}</td>
                        <td className="p-3 text-right text-amber-500">¥{stat.pending.toLocaleString()}</td>
                        <td className="p-3 text-right font-black">¥{stat.total.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className={`p-5 rounded-2xl border space-y-4 ${darkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-100"}`}>
              <div>
                <h3 className="text-sm font-bold flex items-center gap-2">
                  🐾 保護動物（個体）別 コスト明細
                </h3>
              </div>

              <div className="overflow-x-auto rounded-xl border border-slate-700/30">
                <table className="w-full text-left text-xs">
                  <thead className={darkMode ? "bg-slate-800 text-slate-300" : "bg-slate-100 text-slate-700"}>
                    <tr>
                      <th className="p-3">保護動物名</th>
                      <th className="p-3 text-right">医療費</th>
                      <th className="p-3 text-right">フード・その他</th>
                      <th className="p-3 text-right">個体別合計</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700/20">
                    {animalStats.map((a) => (
                      <tr key={a.id}>
                        <td className="p-3 font-bold">
                          {a.species === "dog" ? "🐶" : "🐱"} {a.name}
                        </td>
                        <td className="p-3 text-right text-rose-400 font-semibold">¥{a.medical.toLocaleString()}</td>
                        <td className="p-3 text-right">¥{a.other.toLocaleString()}</td>
                        <td className="p-3 text-right font-black">¥{a.total.toLocaleString()}</td>
                      </tr>
                    ))}
                    <tr>
                      <td className="p-3 font-semibold text-slate-400">共通・個体指定なし</td>
                      <td className="p-3 text-right text-slate-400">-</td>
                      <td className="p-3 text-right text-slate-400">-</td>
                      <td className="p-3 text-right font-bold text-slate-400">¥{unassignedExpenseTotal.toLocaleString()}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        )}

        {/* 📋 タブ1：タイムライン一覧 */}
        {activeTab === "logs" && (
          <section className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 print:hidden">
              <h2 className="text-base font-bold flex items-center gap-2">
                <Clock className="w-5 h-5 text-indigo-500" />
                活動ログ・申請一覧 ({filteredLogs.length}件)
              </h2>

              {userOrgId && (
                <div className="flex gap-1.5 flex-wrap">
                  {(["all", "pending", "expense", "donation"] as const).map((f) => (
                    <button
                      key={f}
                      onClick={() => setFilter(f)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border ${
                        filter === f
                          ? "bg-indigo-600 border-indigo-500 text-white"
                          : darkMode ? "bg-slate-900 border-slate-800 text-slate-400" : "bg-white border-slate-200 text-slate-600"
                      }`}
                    >
                      {f === "all" && "すべて"}
                      {f === "pending" && "⏳ 確認待ち"}
                      {f === "expense" && "経費のみ"}
                      {f === "donation" && "寄付のみ"}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {loading ? (
              <p className="text-center py-8 text-xs text-slate-400">読み込み中...</p>
            ) : filteredLogs.length === 0 ? (
              <div className={`p-8 rounded-2xl border text-center space-y-3 ${darkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-100"}`}>
                <p className="text-xs text-slate-400">
                  表示するデータがありません。ログインして団体を登録するか、右上の「🎮 デモ体験」をお試しください。
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredLogs.map((log) => {
                  const animalObj = animals.find((a) => a.id === log.animal_id);
                  return (
                    <div
                      key={log.id}
                      className={`p-4 rounded-2xl border shadow-sm space-y-2 ${
                        darkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-100"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-lg border ${
                            log.type === "expense"
                              ? "bg-indigo-500/10 text-indigo-400 border-indigo-500/20"
                              : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                          }`}>
                            {log.type === "expense" ? "経費精算" : "物資寄付"}
                          </span>
                          {log.category && (
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-lg bg-slate-500/10 text-slate-400">
                              {log.category}
                            </span>
                          )}
                          {animalObj && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-rose-500/10 text-rose-400">
                              🐾 {animalObj.name}
                            </span>
                          )}
                          <span className="text-xs font-bold">👤 {log.volunteer_name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleStatusChange(log.id, log.status)}
                            className={`text-[10px] font-bold px-2.5 py-0.5 rounded-lg border ${
                              log.status === "approved"
                                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                                : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                            }`}
                          >
                            {log.status === "approved" ? "✔ 承認済み" : "⏳ 確認待ち"}
                          </button>
                          <button onClick={() => handleDelete(log.id, log.title)} className="text-slate-500 hover:text-rose-400">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                      <div className="flex justify-between items-start gap-4">
                        <div>
                          <h4 className="text-sm font-bold">{log.title}</h4>
                          {log.details && <p className="text-xs text-slate-400 mt-0.5">{log.details}</p>}
                        </div>
                        <p className="text-sm font-black text-indigo-400 shrink-0">
                          {log.type === "expense" ? `¥${(log.amount || 0).toLocaleString()}` : `${log.amount || 0} 点`}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        )}

        {/* ログイン / 新規団体登録モーダル */}
        {showLoginModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className={`p-6 rounded-2xl max-w-sm w-full space-y-4 border max-h-[90vh] overflow-y-auto ${darkMode ? "bg-slate-900 border-slate-800 text-white" : "bg-white border-slate-200 text-slate-800"}`}>
              <div className="flex items-center justify-between border-b border-slate-700/60 pb-2">
                <h3 className="text-base font-bold flex items-center gap-2">
                  <Building className="w-4 h-4 text-indigo-500" />
                  {isSignUpMode ? "新規団体・アカウント登録" : "ログイン"}
                </h3>
                <button
                  type="button"
                  onClick={() => setIsSignUpMode(!isSignUpMode)}
                  className="text-xs font-semibold text-indigo-400 hover:underline"
                >
                  {isSignUpMode ? "▶ ログインはこちら" : "▶ 新規団体登録"}
                </button>
              </div>

              {isSignUpMode ? (
                <form onSubmit={handleSignUp} className="space-y-3">
                  <p className="text-[11px] text-slate-400">団体を新しく登録し、あなたの管理アカウントを作成します。</p>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 mb-1">団体名</label>
                    <input
                      type="text"
                      required
                      placeholder="例: 仙台猫保護ボランティア"
                      value={regOrgName}
                      onChange={(e) => setRegOrgName(e.target.value)}
                      className={`w-full px-3 py-2 rounded-xl border text-xs ${darkMode ? "bg-slate-800 border-slate-700 text-white" : "bg-slate-50 border-slate-200"}`}
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 mb-1">団体URLスラッグ（半角英数字）</label>
                    <input
                      type="text"
                      required
                      placeholder="例: sendai-cats"
                      value={regOrgSlug}
                      onChange={(e) => setRegOrgSlug(e.target.value)}
                      className={`w-full px-3 py-2 rounded-xl border text-xs ${darkMode ? "bg-slate-800 border-slate-700 text-white" : "bg-slate-50 border-slate-200"}`}
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 mb-1">あなたの氏名（管理者名）</label>
                    <input
                      type="text"
                      required
                      placeholder="例: 千葉 健太郎"
                      value={regAdminName}
                      onChange={(e) => setRegAdminName(e.target.value)}
                      className={`w-full px-3 py-2 rounded-xl border text-xs ${darkMode ? "bg-slate-800 border-slate-700 text-white" : "bg-slate-50 border-slate-200"}`}
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 mb-1">メールアドレス</label>
                    <input
                      type="email"
                      required
                      placeholder="admin@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className={`w-full px-3 py-2 rounded-xl border text-xs ${darkMode ? "bg-slate-800 border-slate-700 text-white" : "bg-slate-50 border-slate-200"}`}
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 mb-1">パスワード</label>
                    <input
                      type="password"
                      required
                      placeholder="6文字以上"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className={`w-full px-3 py-2 rounded-xl border text-xs ${darkMode ? "bg-slate-800 border-slate-700 text-white" : "bg-slate-50 border-slate-200"}`}
                    />
                  </div>
                  <div className="flex justify-end gap-2 pt-2">
                    <button type="button" onClick={() => setShowLoginModal(false)} className="px-3 py-1.5 rounded-xl border text-xs font-semibold">
                      キャンセル
                    </button>
                    <button type="submit" disabled={loginLoading} className="px-4 py-1.5 rounded-xl bg-indigo-600 text-white text-xs font-semibold">
                      {loginLoading ? "登録中..." : "団体とアカウントを作成"}
                    </button>
                  </div>
                </form>
              ) : (
                <form onSubmit={handleLogin} className="space-y-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 mb-1">メールアドレス</label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className={`w-full px-3 py-2 rounded-xl border text-xs ${darkMode ? "bg-slate-800 border-slate-700 text-white" : "bg-slate-50 border-slate-200"}`}
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 mb-1">パスワード</label>
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className={`w-full px-3 py-2 rounded-xl border text-xs ${darkMode ? "bg-slate-800 border-slate-700 text-white" : "bg-slate-50 border-slate-200"}`}
                    />
                  </div>
                  <div className="flex justify-end gap-2 pt-2">
                    <button type="button" onClick={() => setShowLoginModal(false)} className="px-3 py-1.5 rounded-xl border text-xs font-semibold">
                      キャンセル
                    </button>
                    <button type="submit" disabled={loginLoading} className="px-4 py-1.5 rounded-xl bg-indigo-600 text-white text-xs font-semibold">
                      {loginLoading ? "ログイン中..." : "ログイン"}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
