'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import {
  Wallet,
  Package,
  Clock,
  Send,
  PlusCircle,
  Receipt,
  CheckCircle2,
  Trash2,
  AlertCircle,
  Download,
  Printer,
  Image as ImageIcon,
  ExternalLink,
  Lock,
  Unlock,
  LogOut,
  Moon,
  Sun,
  Cat,
  Dog,
  Settings,
  Save,
  Check,
  Bell,
  BellCheck,
  Users,
  Tag,
  User,
  Heart,
  BarChart3,
  FileSpreadsheet,
  ShieldCheck,
  Phone,
  Mail,
  MapPin,
  FileText,
} from "lucide-react";

// 👑 コンポーネント外で一度だけ安全に初期化（ビルドエラーを完全に回避）
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

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, "+")
    .replace(/_/g, "/");

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export default function Home() {
  // ⚠️ コンポーネント内の `const supabase = createClient(...)` は完全に削除しました。
  // 上部で初期化した `supabase` 変数をそのまま利用します。

  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [volunteers, setVolunteers] = useState<Volunteer[]>([]);
  const [animals, setAnimals] = useState<Animal[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // 🌙 ダークモード
  const [darkMode, setDarkMode] = useState(false);

  // ⚙️ 設定・管理パネル
  const [showSettings, setShowSettings] = useState(false);

  // 新規ボランティア追加用
  const [newVolName, setNewVolName] = useState("");
  const [newVolNickname, setNewVolNickname] = useState("");
  const [newVolContact, setNewVolContact] = useState("");
  const [newVolEmail, setNewVolEmail] = useState("");
  const [newVolAddress, setNewVolAddress] = useState("");
  const [newVolNotes, setNewVolNotes] = useState("");

  // 新規動物追加用
  const [newAnimalName, setNewAnimalName] = useState("");
  const [newAnimalSpecies, setNewAnimalSpecies] = useState("cat");

  // 📲 Webプッシュ通知
  const [pushSubscribed, setPushSubscribed] = useState(false);
  const [pushLoading, setPushLoading] = useState(false);

  // 認証
  const [user, setUser] = useState<any>(null);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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

  // 月末集計用の選択月
  const [targetMonth, setTargetMonth] = useState<string>("");

  useEffect(() => {
    setTargetMonth(new Date().toISOString().slice(0, 7));
  }, []);

  useEffect(() => {
    const savedTheme = localStorage.getItem("rescueops_theme");
    if (savedTheme === "dark") setDarkMode(true);

    const cachedVolunteer = localStorage.getItem("rescueops_last_volunteer");
    if (cachedVolunteer) {
      setVolunteerName(cachedVolunteer);
    }

    if ("serviceWorker" in navigator && "PushManager" in window) {
      navigator.serviceWorker.register("/sw.js").then((reg) => {
        reg.pushManager.getSubscription().then((sub) => {
          if (sub) setPushSubscribed(true);
        });
      });
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    fetchInitialData();

    return () => subscription.unsubscribe();
  }, []);

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
    const { data, error } = await supabase
      .from("activity_logs")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error) setLogs(data || []);
  };

  const fetchVolunteers = async () => {
    const { data } = await supabase.from("volunteers").select("*").order("name");
    if (data) setVolunteers(data);
  };

  const fetchAnimals = async () => {
    const { data } = await supabase.from("animals").select("*").order("name");
    if (data) setAnimals(data);
  };

  const handleAddVolunteer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newVolName.trim()) return;

    const { error } = await supabase.from("volunteers").insert([
      {
        name: newVolName.trim(),
        nickname: newVolNickname.trim() || newVolName.trim(),
        contact: newVolContact.trim() || null,
        email: newVolEmail.trim() || null,
        address: newVolAddress.trim() || null,
        notes: newVolNotes.trim() || null,
        role: "ボランティア",
      },
    ]);
    if (error) {
      alert("追加に失敗しました: " + error.message);
    } else {
      setNewVolName("");
      setNewVolNickname("");
      setNewVolContact("");
      setNewVolEmail("");
      setNewVolAddress("");
      setNewVolNotes("");
      fetchVolunteers();
    }
  };

  const handleAddAnimal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAnimalName.trim()) return;

    const { error } = await supabase.from("animals").insert([
      { name: newAnimalName.trim(), species: newAnimalSpecies },
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
    await supabase.from("volunteers").delete().eq("id", id);
    fetchVolunteers();
  };

  const handleDeleteAnimal = async (id: string) => {
    if (!confirm("この保護動物を削除してもよろしいですか？")) return;
    await supabase.from("animals").delete().eq("id", id);
    fetchAnimals();
  };

  const subscribeToPush = async () => {
    if (!user) {
      alert("プッシュ通知の購読には管理者ログインが必要です。");
      setShowLoginModal(true);
      return;
    }

    setPushLoading(true);
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        alert("通知が許可されませんでした。");
        setPushLoading(false);
        return;
      }

      const registration = await navigator.serviceWorker.ready;
      const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

      if (!vapidPublicKey) {
        alert("VAPID公開鍵が設定されていません。");
        setPushLoading(false);
        return;
      }

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
      });

      await supabase.from("push_subscriptions").insert([
        {
          user_id: user.id,
          subscription: subscription.toJSON(),
        },
      ]);

      setPushSubscribed(true);
      alert("Webプッシュ通知を有効化しました！");
    } catch (err: any) {
      alert("通知設定エラー: " + err.message);
    }
    setPushLoading(false);
  };

  const sendPushNotification = async (logData: {
    title: string;
    amount: number | null;
    volunteerName: string;
    category: string;
    type: string;
  }) => {
    const isExpense = logData.type === "expense";
    const amountLabel = isExpense
      ? `¥${(logData.amount || 0).toLocaleString()}`
      : `${logData.amount || 0} 点`;

    fetch("/api/push", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: `🐾 RescueOps: ${logData.volunteerName}さんからの申請`,
        body: `${logData.title} (${amountLabel}) - [${logData.category}]`,
      }),
    }).catch((err) => console.error("プッシュ通知送信エラー:", err));
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      alert("ログイン失敗: " + error.message);
    } else {
      setEmail("");
      setPassword("");
      setShowLoginModal(false);
    }
    setLoginLoading(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    if (type === "expense" && (!volunteerName || volunteerName === "匿名")) {
      alert("経費精算の場合は、有効な申請者名（愛称）を選択してください。");
      return;
    }

    setSubmitting(true);
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

    const newAmount = amount ? Number(amount) : null;
    const selectedAnimalId = animalId ? animalId : null;
    const finalVolunteerName = volunteerName.trim() || "匿名";

    localStorage.setItem("rescueops_last_volunteer", finalVolunteerName);

    const { error } = await supabase.from("activity_logs").insert([
      {
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
      sendPushNotification({
        title,
        amount: newAmount,
        volunteerName: finalVolunteerName,
        category,
        type,
      });

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
    if (!user) {
      alert("ステータス変更には管理者ログインが必要です。");
      setShowLoginModal(true);
      return;
    }
    const newStatus = currentStatus === "approved" ? "pending" : "approved";
    await supabase.from("activity_logs").update({ status: newStatus }).eq("id", id);
    fetchLogs();
  };

  const handleDelete = async (id: string, title: string) => {
    if (!user) {
      alert("削除には管理者ログインが必要です。");
      setShowLoginModal(true);
      return;
    }
    if (!confirm(`「${title}」を削除しますか？`)) return;
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
        `"${animalObj ? animalObj.name : "なし"}"`,
        `"${log.title.replace(/"/g, '""')}"`,
        log.amount ?? "",
        `"${(log.details || "").replace(/"/g, '""')}"`,
        log.status === "approved" ? "承認済み" : "確認待ち",
      ];
    });

    const csvContent =
      "\uFEFF" + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `RescueOps_Report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  // 月末集計の計算
  const monthlyLogs = logs.filter((log) => {
    if (!log.created_at) return false;
    const logMonth = log.created_at.slice(0, 7);
    return log.type === "expense" && log.status === "approved" && logMonth === targetMonth;
  });

  const volunteerSummaryMap: { [key: string]: { totalAmount: number; count: number; items: string[] } } = {};
  monthlyLogs.forEach((log) => {
    const name = log.volunteer_name || "不明";
    if (!volunteerSummaryMap[name]) {
      volunteerSummaryMap[name] = { totalAmount: 0, count: 0, items: [] };
    }
    volunteerSummaryMap[name].totalAmount += log.amount || 0;
    volunteerSummaryMap[name].count += 1;
    volunteerSummaryMap[name].items.push(log.title);
  });

  const volunteerSummaryList = Object.keys(volunteerSummaryMap).map((name) => ({
    name,
    ...volunteerSummaryMap[name],
  }));

  const totalMonthlyExpense = volunteerSummaryList.reduce((sum, v) => sum + v.totalAmount, 0);

  const exportMonthlySummaryCSV = () => {
    if (volunteerSummaryList.length === 0) {
      alert("指定された月の承認済み集計データがありません。");
      return;
    }

    const headers = ["対象月", "申請者/愛称", "承認済み件数", "立替金額合計(円)", "内訳項目"];
    const rows = volunteerSummaryList.map((v) => [
      targetMonth,
      `"${v.name}"`,
      v.count,
      v.totalAmount,
      `"${v.items.join(" / ")}"`,
    ]);

    const csvContent =
      "\uFEFF" + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `RescueOps_Payout_${targetMonth}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredLogs = logs.filter((log) => {
    if (filter === "expense" && log.type !== "expense") return false;
    if (filter === "donation" && log.type !== "donation") return false;
    if (filter === "pending" && log.status !== "pending") return false;
    if (categoryFilter !== "all" && log.category !== categoryFilter) return false;
    return true;
  });

  const pendingCount = logs.filter((l) => l.status === "pending").length;
  const totalExpense = logs
    .filter((l) => l.type === "expense" && l.status === "approved")
    .reduce((sum, l) => sum + (l.amount || 0), 0);

  return (
    <div
      className={`min-h-screen transition-colors duration-300 p-4 md:p-8 relative ${
        darkMode ? "bg-slate-950 text-slate-100" : "bg-slate-50 text-slate-800"
      }`}
    >
      <div className="max-w-3xl mx-auto space-y-8">
        
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
              <h1 className="text-2xl font-black tracking-tight flex items-center gap-2">
                RescueOps
                <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-500 border border-amber-500/20 print:hidden">
                  v4.4
                </span>
              </h1>
              <p className={`text-xs mt-0.5 ${darkMode ? "text-slate-400" : "text-slate-500"}`}>
                動物保護活動・ボランティア支援プラットフォーム
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap print:hidden">
            {user && (
              <button
                onClick={subscribeToPush}
                disabled={pushSubscribed || pushLoading}
                className={`px-3 py-2 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm ${
                  pushSubscribed
                    ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-500 cursor-default"
                    : "bg-indigo-600 hover:bg-indigo-500 border-indigo-500 text-white"
                }`}
              >
                {pushSubscribed ? <BellCheck className="w-4 h-4 text-emerald-500" /> : <Bell className="w-4 h-4" />}
                {pushSubscribed ? "通知有効" : "通知を受信"}
              </button>
            )}

            <button
              onClick={() => setShowSettings(!showSettings)}
              title="管理者・名簿管理パネル"
              className={`p-2.5 rounded-xl border transition-all ${
                showSettings
                  ? "bg-indigo-600 border-indigo-500 text-white"
                  : darkMode
                  ? "bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700"
                  : "bg-slate-100 border-slate-200 text-slate-600 hover:bg-slate-200"
              }`}
            >
              <Settings className="w-4 h-4" />
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
              onClick={handlePrint}
              className={`px-3.5 py-2 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm ${
                darkMode ? "bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700" : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
              }`}
            >
              <Printer className="w-4 h-4 text-indigo-500" />
              印刷 / PDF
            </button>

            <button
              onClick={exportToCSV}
              className={`px-3.5 py-2 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm ${
                darkMode ? "bg-slate-800 border-slate-700 text-slate-200" : "bg-white border-slate-200 text-slate-700"
              }`}
            >
              <Download className="w-4 h-4 text-indigo-500" />
              CSV
            </button>

            {user ? (
              <div className="flex items-center gap-2">
                <span className="bg-emerald-500/10 text-emerald-500 text-xs font-semibold px-3 py-2 rounded-xl border border-emerald-500/20 flex items-center gap-1">
                  <Unlock className="w-3 h-3" />
                  管理者
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
              <button
                onClick={() => setShowLoginModal(true)}
                className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm"
              >
                <Lock className="w-3.5 h-3.5" />
                管理者ログイン
              </button>
            )}
          </div>
        </header>

        {/* ⚙️ 管理者専用パネル */}
        {showSettings && (
          <section
            className={`rounded-2xl p-5 border shadow-sm space-y-6 transition-all print:hidden ${
              darkMode ? "bg-slate-900/90 border-indigo-500/30" : "bg-indigo-50/50 border-indigo-200"
            }`}
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold flex items-center gap-2 text-indigo-500">
                  <ShieldCheck className="w-4 h-4 text-emerald-500" />
                  管理者専用：詳細ボランティア名簿 ({volunteers.length}名)
                </h3>
                {!user && (
                  <span className="text-[10px] bg-amber-500/10 text-amber-500 border border-amber-500/20 px-2.5 py-1 rounded-lg font-semibold flex items-center gap-1">
                    <Lock className="w-3 h-3" /> 名簿の管理には管理者ログインが必要です
                  </span>
                )}
              </div>

              {user ? (
                <div className="space-y-4">
                  <div className="overflow-x-auto rounded-xl border border-slate-700">
                    <table className="w-full text-left text-xs">
                      <thead className={darkMode ? "bg-slate-800 text-slate-300" : "bg-indigo-100 text-indigo-900"}>
                        <tr>
                          <th className="p-2.5">氏名 (本名)</th>
                          <th className="p-2.5">愛称</th>
                          <th className="p-2.5">連絡先</th>
                          <th className="p-2.5">メール</th>
                          <th className="p-2.5">住所</th>
                          <th className="p-2.5">備考</th>
                          <th className="p-2.5 text-center">操作</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800">
                        {volunteers.map((vol) => (
                          <tr key={vol.id} className={darkMode ? "hover:bg-slate-800/50" : "hover:bg-white"}>
                            <td className="p-2.5 font-bold">{vol.name}</td>
                            <td className="p-2.5 text-indigo-400 font-semibold">{vol.nickname || "-"}</td>
                            <td className="p-2.5 text-slate-300">{vol.contact || "-"}</td>
                            <td className="p-2.5 text-slate-300">{vol.email || "-"}</td>
                            <td className="p-2.5 text-slate-300">{vol.address || "-"}</td>
                            <td className="p-2.5 text-slate-400">{vol.notes || "-"}</td>
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

                  <form onSubmit={handleAddVolunteer} className={`p-4 rounded-xl border space-y-3 ${darkMode ? "bg-slate-800/60 border-slate-700" : "bg-white border-indigo-100"}`}>
                    <p className="text-xs font-bold text-indigo-400">＋ 新しいメンバーを追加する</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                      <input
                        type="text"
                        required
                        placeholder="氏名 / 本名（必須）"
                        value={newVolName}
                        onChange={(e) => setNewVolName(e.target.value)}
                        className={`px-3 py-2 rounded-xl border text-xs ${darkMode ? "bg-slate-900 border-slate-700 text-white" : "bg-slate-50 border-slate-200"}`}
                      />
                      <input
                        type="text"
                        placeholder="愛称 / ニックネーム"
                        value={newVolNickname}
                        onChange={(e) => setNewVolNickname(e.target.value)}
                        className={`px-3 py-2 rounded-xl border text-xs ${darkMode ? "bg-slate-900 border-slate-700 text-white" : "bg-slate-50 border-slate-200"}`}
                      />
                      <input
                        type="text"
                        placeholder="電話番号"
                        value={newVolContact}
                        onChange={(e) => setNewVolContact(e.target.value)}
                        className={`px-3 py-2 rounded-xl border text-xs ${darkMode ? "bg-slate-900 border-slate-700 text-white" : "bg-slate-50 border-slate-200"}`}
                      />
                      <input
                        type="email"
                        placeholder="メールアドレス"
                        value={newVolEmail}
                        onChange={(e) => setNewVolEmail(e.target.value)}
                        className={`px-3 py-2 rounded-xl border text-xs ${darkMode ? "bg-slate-900 border-slate-700 text-white" : "bg-slate-50 border-slate-200"}`}
                      />
                      <input
                        type="text"
                        placeholder="住所"
                        value={newVolAddress}
                        onChange={(e) => setNewVolAddress(e.target.value)}
                        className={`px-3 py-2 rounded-xl border text-xs ${darkMode ? "bg-slate-900 border-slate-700 text-white" : "bg-slate-50 border-slate-200"}`}
                      />
                      <input
                        type="text"
                        placeholder="備考"
                        value={newVolNotes}
                        onChange={(e) => setNewVolNotes(e.target.value)}
                        className={`px-3 py-2 rounded-xl border text-xs ${darkMode ? "bg-slate-900 border-slate-700 text-white" : "bg-slate-50 border-slate-200"}`}
                      />
                    </div>
                    <button type="submit" className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow-sm">
                      名簿に追加登録する
                    </button>
                  </form>
                </div>
              ) : (
                <div className={`p-4 rounded-xl border text-center text-xs text-slate-400 ${darkMode ? "bg-slate-800/40 border-slate-800" : "bg-slate-100"}`}>
                  管理者としてログインすると、メンバーの詳細名簿の閲覧・追加・削除が行えるようになります。
                </div>
              )}
            </div>

            <hr className={darkMode ? "border-slate-800" : "border-indigo-100"} />

            {/* 保護動物リスト管理 */}
            <div className="space-y-3">
              <h3 className="text-sm font-bold flex items-center gap-2 text-indigo-500">
                <Heart className="w-4 h-4" />
                保護動物リストの管理 ({animals.length}匹)
              </h3>
              <div className="flex flex-wrap gap-2">
                {animals.map((anim) => (
                  <span
                    key={anim.id}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border ${
                      darkMode ? "bg-slate-800 border-slate-700 text-slate-200" : "bg-white border-indigo-200 text-slate-700 shadow-sm"
                    }`}
                  >
                    {anim.species === "cat" ? <Cat className="w-3 h-3 text-amber-500" /> : <Dog className="w-3 h-3 text-indigo-400" />}
                    {anim.name}
                    {user && (
                      <button onClick={() => handleDeleteAnimal(anim.id)} className="text-slate-400 hover:text-rose-500 ml-1">
                        ×
                      </button>
                    )}
                  </span>
                ))}
              </div>

              {user && (
                <form onSubmit={handleAddAnimal} className="flex gap-2 pt-1">
                  <select
                    value={newAnimalSpecies}
                    onChange={(e) => setNewAnimalSpecies(e.target.value)}
                    className={`px-2 py-1.5 rounded-xl border text-xs ${
                      darkMode ? "bg-slate-800 border-slate-700 text-white" : "bg-white border-slate-200"
                    }`}
                  >
                    <option value="cat">猫</option>
                    <option value="dog">犬</option>
                  </select>
                  <input
                    type="text"
                    placeholder="保護動物の名前"
                    value={newAnimalName}
                    onChange={(e) => setNewAnimalName(e.target.value)}
                    className={`flex-1 px-3 py-1.5 rounded-xl border text-xs ${
                      darkMode ? "bg-slate-800 border-slate-700 text-white" : "bg-white border-slate-200"
                    }`}
                  />
                  <button type="submit" className="px-3 py-1.5 bg-indigo-600 text-white text-xs font-semibold rounded-xl">
                    動物追加
                  </button>
                </form>
              )}
            </div>
          </section>
        )}

        {/* 📊 サマリーカード */}
        <section className="grid grid-cols-1 sm:grid-cols-3 gap-4 print:hidden">
          <div className={`p-5 rounded-2xl border shadow-sm flex items-center justify-between ${darkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-100"}`}>
            <div>
              <p className="text-xs font-semibold text-slate-400">確認待ちの申請</p>
              <p className="text-2xl font-black text-amber-500 mt-1">{pendingCount} <span className="text-xs font-normal text-slate-500">件</span></p>
            </div>
            <div className="p-3 bg-amber-500/10 text-amber-500 rounded-xl"><AlertCircle className="w-5 h-5" /></div>
          </div>

          <div className={`p-5 rounded-2xl border shadow-sm flex items-center justify-between ${darkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-100"}`}>
            <div>
              <p className="text-xs font-semibold text-slate-400">承認済み立替総額</p>
              <p className="text-2xl font-black text-emerald-500 mt-1">¥{totalExpense.toLocaleString()}</p>
            </div>
            <div className="p-3 bg-emerald-500/10 text-emerald-500 rounded-xl"><Wallet className="w-5 h-5" /></div>
          </div>

          <div className={`p-5 rounded-2xl border shadow-sm flex items-center justify-between ${darkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-100"}`}>
            <div>
              <p className="text-xs font-semibold text-slate-400">保護動物登録数</p>
              <p className="text-2xl font-black text-indigo-500 mt-1">{animals.length} <span className="text-xs font-normal text-slate-500">匹</span></p>
            </div>
            <div className="p-3 bg-indigo-500/10 text-indigo-500 rounded-xl"><Heart className="w-5 h-5" /></div>
          </div>
        </section>

        {/* メインのタブ切り替え */}
        <div className="flex border-b border-slate-700 gap-4 print:hidden">
          <button
            onClick={() => setActiveTab("logs")}
            className={`pb-3 text-sm font-bold border-b-2 transition-all flex items-center gap-2 ${
              activeTab === "logs"
                ? "border-indigo-500 text-indigo-500"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <Clock className="w-4 h-4" />
            活動・申請タイムライン
          </button>
          <button
            onClick={() => setActiveTab("summary")}
            className={`pb-3 text-sm font-bold border-b-2 transition-all flex items-center gap-2 ${
              activeTab === "summary"
                ? "border-indigo-500 text-indigo-500"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            月末精算・月別集計
          </button>
        </div>

        {/* タブ1: タイムライン & 申請フォーム */}
        {activeTab === "logs" && (
          <div className="space-y-8">
            {/* 📝 新規申請フォーム */}
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

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                    <label className="block text-xs font-semibold mb-1">カテゴリ</label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className={`w-full px-3 py-2 rounded-xl border text-xs ${darkMode ? "bg-slate-800 border-slate-700 text-white" : "bg-slate-50 border-slate-200"}`}
                    >
                      <option value="医療費">医療費・通院</option>
                      <option value="フード">フード・おやつ</option>
                      <option value="消耗品">砂・ペットシーツ等の消耗品</option>
                      <option value="交通費">交通費・ガソリン代</option>
                      <option value="その他">その他</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold mb-1">対象の保護動物</label>
                    <select
                      value={animalId}
                      onChange={(e) => setAnimalId(e.target.value)}
                      className={`w-full px-3 py-2 rounded-xl border text-xs ${darkMode ? "bg-slate-800 border-slate-700 text-white" : "bg-slate-50 border-slate-200"}`}
                    >
                      <option value="">指定なし（全体・保護猫部屋など）</option>
                      {animals.map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.species === "cat" ? "🐱" : "🐶"} {a.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold mb-1">
                      {type === "expense" ? "金額 (円)" : "数量 (点など)"}
                    </label>
                    <input
                      type="number"
                      placeholder={type === "expense" ? "例: 3500" : "例: 2"}
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className={`w-full px-3 py-2 rounded-xl border text-xs ${darkMode ? "bg-slate-800 border-slate-700 text-white" : "bg-slate-50 border-slate-200"}`}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1">項目名・タイトル（必須）</label>
                  <input
                    type="text"
                    required
                    placeholder={type === "expense" ? "例: ○○病院 血液検査代" : "例: ロイヤルカナン パウチ 24個"}
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className={`w-full px-3 py-2 rounded-xl border text-xs ${darkMode ? "bg-slate-800 border-slate-700 text-white" : "bg-slate-50 border-slate-200"}`}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1">詳細メモ</label>
                  <textarea
                    rows={2}
                    placeholder="レシートの特記事項や、購入したお店など"
                    value={details}
                    onChange={(e) => setDetails(e.target.value)}
                    className={`w-full px-3 py-2 rounded-xl border text-xs ${darkMode ? "bg-slate-800 border-slate-700 text-white" : "bg-slate-50 border-slate-200"}`}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1">レシート画像 / 写真</label>
                  <input
                    id="image-input"
                    type="file"
                    accept="image/*"
                    onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                    className="w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-600 hover:file:bg-indigo-100"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-sm transition-all flex items-center justify-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  {submitting ? "送信中..." : "申請を送信する"}
                </button>
              </form>
            </section>

            {/* 📋 タイムライン一覧 */}
            <section className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 print:hidden">
                <h2 className="text-base font-bold flex items-center gap-2">
                  <Clock className="w-5 h-5 text-indigo-500" />
                  活動ログ・申請一覧 ({filteredLogs.length}件)
                </h2>

                <div className="flex items-center gap-2 flex-wrap">
                  <select
                    value={filter}
                    onChange={(e: any) => setFilter(e.target.value)}
                    className={`px-3 py-1.5 rounded-xl border text-xs ${darkMode ? "bg-slate-900 border-slate-700 text-white" : "bg-white border-slate-200"}`}
                  >
                    <option value="all">すべて表示</option>
                    <option value="expense">経費精算のみ</option>
                    <option value="donation">物資寄付のみ</option>
                    <option value="pending">確認待ちのみ</option>
                  </select>
                </div>
              </div>

              {loading ? (
                <p className="text-center py-8 text-xs text-slate-400">読み込み中...</p>
              ) : filteredLogs.length === 0 ? (
                <div className={`p-8 rounded-2xl border text-center text-xs text-slate-400 ${darkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-100"}`}>
                  該当する記録はありません。
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredLogs.map((log) => {
                    const animalObj = animals.find((a) => a.id === log.animal_id);
                    return (
                      <div
                        key={log.id}
                        className={`p-4 rounded-2xl border shadow-sm space-y-3 ${
                          darkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-100"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span
                              className={`text-[10px] font-bold px-2.5 py-1 rounded-lg border ${
                                log.type === "expense"
                                  ? "bg-indigo-500/10 text-indigo-400 border-indigo-500/20"
                                  : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                              }`}
                            >
                              {log.type === "expense" ? "立替・経費" : "物資寄付"}
                            </span>
                            <span className="text-xs font-bold text-slate-300">👤 {log.volunteer_name || "匿名"}</span>
                            {log.category && (
                              <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded-md">
                                {log.category}
                              </span>
                            )}
                            {animalObj && (
                              <span className="text-[10px] bg-indigo-500/10 text-indigo-300 px-2 py-0.5 rounded-md flex items-center gap-1">
                                {animalObj.species === "cat" ? "🐱" : "🐶"} {animalObj.name}
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleStatusChange(log.id, log.status)}
                              className={`text-[10px] font-bold px-2.5 py-1 rounded-lg border transition-all ${
                                log.status === "approved"
                                  ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                                  : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                              }`}
                            >
                              {log.status === "approved" ? "✔ 承認済み" : "⏳ 確認待ち"}
                            </button>
                            <button
                              onClick={() => handleDelete(log.id, log.title)}
                              className="text-slate-500 hover:text-rose-400 p-1 print:hidden"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <h3 className="text-sm font-bold">{log.title}</h3>
                            {log.details && <p className="text-xs text-slate-400 mt-1">{log.details}</p>}
                          </div>
                          {log.amount !== null && (
                            <p className="text-base font-black text-indigo-400 whitespace-nowrap">
                              {log.type === "expense" ? `¥${log.amount.toLocaleString()}` : `${log.amount} 点`}
                            </p>
                          )}
                        </div>

                        {log.image_url && (
                          <div className="pt-2">
                            <a href={log.image_url} target="_blank" rel="noopener noreferrer" className="inline-block">
                              <img src={log.image_url} alt="レシート画像" className="w-20 h-20 object-cover rounded-xl border border-slate-700 hover:opacity-80 transition-opacity" />
                            </a>
                          </div>
                        )}

                        <div className="text-[10px] text-slate-500 pt-1 border-t border-slate-800/60">
                          {new Date(log.created_at).toLocaleString("ja-JP")}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          </div>
        )}

        {/* タブ2: 月末集計・清算画面 */}
        {activeTab === "summary" && (
          <div className="space-y-6">
            <section className={`rounded-2xl p-6 border shadow-sm space-y-4 ${darkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-100"}`}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-base font-bold flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-indigo-500" />
                    月末精算・ボランティア別立替集計
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">指定した月の「承認済み」経費を自動で集計します</p>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="month"
                    value={targetMonth}
                    onChange={(e) => setTargetMonth(e.target.value)}
                    className={`px-3 py-2 rounded-xl border text-xs font-bold ${darkMode ? "bg-slate-800 border-slate-700 text-white" : "bg-slate-50 border-slate-200"}`}
                  />
                  <button
                    onClick={exportMonthlySummaryCSV}
                    className="px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow-sm flex items-center gap-1.5"
                  >
                    <Download className="w-4 h-4" />
                    清算CSV出力
                  </button>
                </div>
              </div>

              <div className="p-4 rounded-xl border bg-indigo-500/5 border-indigo-500/20 flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-400">対象月 ({targetMonth}) の立替合計</p>
                  <p className="text-2xl font-black text-indigo-400 mt-1">¥{totalMonthlyExpense.toLocaleString()}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-slate-400">対象メンバー数</p>
                  <p className="text-xl font-bold mt-1">{volunteerSummaryList.length} <span className="text-xs font-normal">名</span></p>
                </div>
              </div>

              <div className="overflow-x-auto rounded-xl border border-slate-700">
                <table className="w-full text-left text-xs">
                  <thead className={darkMode ? "bg-slate-800 text-slate-300" : "bg-indigo-100 text-indigo-900"}>
                    <tr>
                      <th className="p-3">申請者 / 愛称</th>
                      <th className="p-3 text-center">承認件数</th>
                      <th className="p-3 text-right">立替金額合計</th>
                      <th className="p-3">内訳項目</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {volunteerSummaryList.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="p-6 text-center text-slate-400">
                          この月の承認済み立替データはありません。
                        </td>
                      </tr>
                    ) : (
                      volunteerSummaryList.map((v, i) => (
                        <tr key={i} className={darkMode ? "hover:bg-slate-800/50" : "hover:bg-white"}>
                          <td className="p-3 font-bold text-indigo-400">{v.name}</td>
                          <td className="p-3 text-center font-semibold">{v.count} 件</td>
                          <td className="p-3 text-right font-black text-emerald-400">¥{v.totalAmount.toLocaleString()}</td>
                          <td className="p-3 text-slate-300">{v.items.join(" / ")}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        )}

        {/* ログインモーダル */}
        {showLoginModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className={`p-6 rounded-2xl max-w-sm w-full space-y-4 border ${darkMode ? "bg-slate-900 border-slate-800 text-white" : "bg-white border-slate-200 text-slate-800"}`}>
              <h3 className="text-base font-bold flex items-center gap-2">
                <Lock className="w-4 h-4 text-indigo-500" />
                管理者ログイン
              </h3>
              <form onSubmit={handleLogin} className="space-y-3">
                <input
                  type="email"
                  required
                  placeholder="管理者メールアドレス"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={`w-full px-3 py-2 rounded-xl border text-xs ${darkMode ? "bg-slate-800 border-slate-700 text-white" : "bg-slate-50 border-slate-200"}`}
                />
                <input
                  type="password"
                  required
                  placeholder="パスワード"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`w-full px-3 py-2 rounded-xl border text-xs ${darkMode ? "bg-slate-800 border-slate-700 text-white" : "bg-slate-50 border-slate-200"}`}
                />
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowLoginModal(false)}
                    className="px-3 py-1.5 rounded-xl border text-xs font-semibold"
                  >
                    キャンセル
                  </button>
                  <button
                    type="submit"
                    disabled={loginLoading}
                    className="px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold"
                  >
                    {loginLoading ? "ログイン中..." : "ログイン"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}