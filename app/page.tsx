"use client";

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

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

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
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [volunteers, setVolunteers] = useState<Volunteer[]>([]);
  const [animals, setAnimals] = useState<Animal[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // 🌙 ダークモード
  const [darkMode, setDarkMode] = useState(false);

  // ⚙️ 設定・管理パネル
  const [showSettings, setShowSettings] = useState(false);

  // 新規ボランティア追加用（6項目）
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
 // 変更前
// const [targetMonth, setTargetMonth] = useState<string>(
//   new Date().toISOString().slice(0, 7)
// );

// 変更後
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

        {/* ⚙️ 管理者専用パネル (名簿6項目 & 保護動物管理) */}
        {showSettings && (
          <section
            className={`rounded-2xl p-5 border shadow-sm space-y-6 transition-all print:hidden ${
              darkMode ? "bg-slate-900/90 border-indigo-500/30" : "bg-indigo-50/50 border-indigo-200"
            }`}
          >
            {/* 🔐 管理者専用：詳細名簿・連絡先管理セクション（6項目対応） */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold flex items-center gap-2 text-indigo-500">
                  <ShieldCheck className="w-4 h-4 text-emerald-500" />
                  管理者専用：詳細ボランティア名簿 ({volunteers.length}名)
                </h3>
                {!user && (
                  <span className="text-[10px] bg-amber-500/10 text-amber-500 border border-amber-500/20 px-2.5 py-1 rounded-lg font-semibold flex items-center gap-1">
                    <Lock className="w-3 h-3" /> 名簿の閲覧・追加・削除には管理者ログインが必要です
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

                  {/* 新規登録フォーム（6項目完全対応） */}
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
                        placeholder="備考（例: 預かり専門、水曜休み）"
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
                  管理者としてログインすると、メンバーの詳細名簿（氏名・愛称・電話番号・メール・住所・備考）の一覧確認および追加・削除が行えるようになります。
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
                      <button
                        onClick={() => handleDeleteAnimal(anim.id)}
                        className="text-slate-400 hover:text-rose-500 ml-1"
                      >
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
                    placeholder="保護動物の名前（例: みけちゃん）"
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
              <p className="text-xs font-semibold text-slate-400">承認済み経費合計</p>
              <p className="text-2xl font-black text-rose-500 mt-1">¥{totalExpense.toLocaleString()}</p>
            </div>
            <div className="p-3 bg-rose-500/10 text-rose-500 rounded-xl"><Wallet className="w-5 h-5" /></div>
          </div>

          <div className={`p-5 rounded-2xl border shadow-sm flex items-center justify-between ${darkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-100"}`}>
            <div>
              <p className="text-xs font-semibold text-slate-400">登録ボランティア</p>
              <p className="text-2xl font-black text-emerald-500 mt-1">{volunteers.length} <span className="text-xs font-normal text-slate-500">名</span></p>
            </div>
            <div className="p-3 bg-emerald-500/10 text-emerald-500 rounded-xl"><Users className="w-5 h-5" /></div>
          </div>
        </section>

        {/* 📋 メインタブ切り替え */}
        <div className="flex border-b gap-4 pb-2 border-slate-800 print:hidden">
          <button
            onClick={() => setActiveTab("logs")}
            className={`text-sm font-bold pb-2 border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === "logs"
                ? "border-indigo-500 text-indigo-400"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <Receipt className="w-4 h-4" />
            活動レポート履歴・申請
          </button>
          <button
            onClick={() => setActiveTab("summary")}
            className={`text-sm font-bold pb-2 border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === "summary"
                ? "border-indigo-500 text-indigo-400"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            📊 月末集計・振込管理
          </button>
        </div>

        {/* ---------------- 📊 タブ1: 月末集計・振込管理 ---------------- */}
        {activeTab === "summary" && (
          <section className="space-y-6 animate-fadeIn">
            <div className={`rounded-2xl p-6 border shadow-sm space-y-4 print:border-none print:shadow-none print:p-0 ${darkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-100"}`}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-lg font-bold flex items-center gap-2">
                    <FileSpreadsheet className="w-5 h-5 text-indigo-500" />
                    ボランティア別 月次立替精算ダッシュボード ({targetMonth})
                  </h2>
                  <p className={`text-xs mt-1 ${darkMode ? "text-slate-400" : "text-slate-500"}`}>
                    指定した月に「承認済み」になった経費精算を愛称ごとに自動集計した収支報告書です。
                  </p>
                </div>

                <div className="flex items-center gap-2 print:hidden">
                  <label className="text-xs font-semibold text-slate-400">対象月:</label>
                  <input
                    type="month"
                    value={targetMonth}
                    onChange={(e) => setTargetMonth(e.target.value)}
                    className={`px-3 py-2 rounded-xl border text-xs font-bold ${
                      darkMode ? "bg-slate-800 border-slate-700 text-white" : "bg-slate-50 border-slate-200 text-slate-800"
                    }`}
                  />
                </div>
              </div>

              <div className={`grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl border ${darkMode ? "bg-slate-950 border-slate-800" : "bg-indigo-50/50 border-indigo-100"}`}>
                <div>
                  <span className="text-xs text-slate-400 block">選択月の精算対象総額</span>
                  <span className="text-2xl font-black text-rose-500">¥{totalMonthlyExpense.toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-xs text-slate-400 block">対象メンバー数</span>
                  <span className="text-2xl font-black text-indigo-400">{volunteerSummaryList.length} 名</span>
                </div>
              </div>

              {volunteerSummaryList.length === 0 ? (
                <div className="text-center py-12 text-sm text-slate-500">
                  {targetMonth} の承認済み経費データはありません
                </div>
              ) : (
                <div className="space-y-3">
                  {volunteerSummaryList.map((vol, index) => (
                    <div
                      key={index}
                      className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                        darkMode ? "bg-slate-800/50 border-slate-700" : "bg-slate-50 border-slate-200"
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-indigo-400 flex items-center gap-1">
                            <User className="w-3.5 h-3.5" /> {vol.name}
                          </span>
                          <span className="text-[10px] bg-slate-700 text-slate-300 px-2 py-0.5 rounded-md">
                            領収書 {vol.count} 件
                          </span>
                        </div>
                        <p className={`text-xs ${darkMode ? "text-slate-400" : "text-slate-600"}`}>
                          内訳: {vol.items.join(", ")}
                        </p>
                      </div>

                      <div className="text-left sm:text-right shrink-0">
                        <span className="text-xs text-slate-400 block">振込金額</span>
                        <span className="text-lg font-black text-rose-500">¥{vol.totalAmount.toLocaleString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex gap-3 print:hidden">
                <button
                  onClick={handlePrint}
                  className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium py-3 rounded-xl transition-all shadow-md flex items-center justify-center gap-2 text-xs font-semibold border border-slate-700"
                >
                  <Printer className="w-4 h-4 text-indigo-400" />
                  集計表をPDFとして保存 / 印刷
                </button>
                <button
                  onClick={exportMonthlySummaryCSV}
                  disabled={volunteerSummaryList.length === 0}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white font-medium py-3 rounded-xl transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50 text-xs font-semibold"
                >
                  <Download className="w-4 h-4" />
                  振込リスト（CSV）
                </button>
              </div>
            </div>
          </section>
        )}

        {/* ---------------- 📝 タブ2: 活動レポート履歴・申請 ---------------- */}
        {activeTab === "logs" && (
          <div className="space-y-8 animate-fadeIn">
            {/* 新規ログ登録フォーム */}
            <section className={`rounded-2xl p-6 shadow-sm border print:hidden ${darkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-100"}`}>
              <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                <PlusCircle className="w-5 h-5 text-indigo-500" />
                新規レポートを投稿する
              </h2>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className={`block text-xs font-semibold uppercase tracking-wider mb-2 ${darkMode ? "text-slate-400" : "text-slate-500"}`}>
                    申請の種別
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setType("expense")}
                      className={`flex items-center justify-center gap-2 p-3 rounded-xl border text-sm font-medium transition-all ${
                        type === "expense"
                          ? "bg-rose-500/10 border-rose-500/40 text-rose-500 font-bold shadow-sm"
                          : darkMode ? "bg-slate-800/50 border-slate-800 text-slate-400" : "bg-slate-50 border-slate-200 text-slate-600"
                      }`}
                    >
                      <Wallet className="w-4 h-4 text-rose-500" /> 経費精算
                    </button>

                    <button
                      type="button"
                      onClick={() => setType("donation")}
                      className={`flex items-center justify-center gap-2 p-3 rounded-xl border text-sm font-medium transition-all ${
                        type === "donation"
                          ? "bg-emerald-500/10 border-emerald-500/40 text-emerald-500 font-bold shadow-sm"
                          : darkMode ? "bg-slate-800/50 border-slate-800 text-slate-400" : "bg-slate-50 border-slate-200 text-slate-600"
                      }`}
                    >
                      <Package className="w-4 h-4 text-emerald-500" /> 物資寄付
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className={`block text-xs font-semibold uppercase tracking-wider ${darkMode ? "text-slate-400" : "text-slate-500"}`}>
                        申請者（愛称） {type === "expense" && <span className="text-rose-500">*</span>}
                      </label>
                      {volunteerName !== "匿名" && (
                        <button
                          type="button"
                          onClick={() => setVolunteerName("匿名")}
                          className="text-[10px] text-indigo-400 hover:underline"
                        >
                          × 匿名にする
                        </button>
                      )}
                    </div>
                    <select
                      value={volunteerName}
                      onChange={(e) => setVolunteerName(e.target.value)}
                      className={`w-full px-4 py-2.5 rounded-xl border text-sm font-bold ${
                        darkMode ? "bg-slate-800 border-slate-700 text-indigo-300" : "bg-slate-50 border-slate-200 text-indigo-600"
                      }`}
                    >
                      <option value="匿名">🔒 匿名（差出人不明）</option>
                      {volunteers.map((vol) => {
                        const label = vol.nickname ? `${vol.nickname} (${vol.name})` : vol.name;
                        const val = vol.nickname || vol.name;
                        return (
                          <option key={vol.id} value={val}>
                            🐾 {label}
                          </option>
                        );
                      })}
                    </select>
                    <p className="text-[10px] text-slate-400 mt-1">※前回選択した愛称が自動記憶されます</p>
                  </div>

                  <div>
                    <label className={`block text-xs font-semibold uppercase tracking-wider mb-1 ${darkMode ? "text-slate-400" : "text-slate-500"}`}>
                      カテゴリ
                    </label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className={`w-full px-4 py-2.5 rounded-xl border text-sm ${
                        darkMode ? "bg-slate-800 border-slate-700 text-white" : "bg-slate-50 border-slate-200"
                      }`}
                    >
                      <option value="医療費">医療費</option>
                      <option value="フード代">フード代</option>
                      <option value="猫砂・シート代">猫砂・シート代</option>
                      <option value="搬送ガソリン代">搬送ガソリン代</option>
                      <option value="その他">その他</option>
                    </select>
                  </div>

                  <div>
                    <label className={`block text-xs font-semibold uppercase tracking-wider mb-1 ${darkMode ? "text-slate-400" : "text-slate-500"}`}>
                      対象の保護動物（任意）
                    </label>
                    <select
                      value={animalId}
                      onChange={(e) => setAnimalId(e.target.value)}
                      className={`w-full px-4 py-2.5 rounded-xl border text-sm ${
                        darkMode ? "bg-slate-800 border-slate-700 text-white" : "bg-slate-50 border-slate-200"
                      }`}
                    >
                      <option value="">全体・指定なし</option>
                      {animals.map((anim) => (
                        <option key={anim.id} value={anim.id}>
                          {anim.species === "cat" ? "🐱" : "🐶"} {anim.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-2">
                    <label className={`block text-xs font-semibold uppercase tracking-wider mb-1 ${darkMode ? "text-slate-400" : "text-slate-500"}`}>
                      項目名 / 品名 <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder={type === "expense" ? "例: ワクチン接種・診察代" : "例: ドライフード 2kg"}
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className={`w-full px-4 py-2.5 rounded-xl border text-sm ${
                        darkMode ? "bg-slate-800 border-slate-700 text-white" : "bg-slate-50 border-slate-200"
                      }`}
                    />
                  </div>

                  <div>
                    <label className={`block text-xs font-semibold uppercase tracking-wider mb-1 ${darkMode ? "text-slate-400" : "text-slate-500"}`}>
                      {type === "expense" ? "金額 (円)" : "数量"}
                    </label>
                    <input
                      type="number"
                      placeholder={type === "expense" ? "例: 5000" : "例: 2"}
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className={`w-full px-4 py-2.5 rounded-xl border text-sm ${
                        darkMode ? "bg-slate-800 border-slate-700 text-white" : "bg-slate-50 border-slate-200"
                      }`}
                    />
                  </div>
                </div>

                <div>
                  <label className={`block text-xs font-semibold uppercase tracking-wider mb-1 ${darkMode ? "text-slate-400" : "text-slate-500"}`}>
                    詳細・メモ
                  </label>
                  <textarea
                    rows={2}
                    placeholder="特記事項があれば入力してください"
                    value={details}
                    onChange={(e) => setDetails(e.target.value)}
                    className={`w-full px-4 py-2.5 rounded-xl border text-sm resize-none ${
                      darkMode ? "bg-slate-800 border-slate-700 text-white" : "bg-slate-50 border-slate-200"
                    }`}
                  />
                </div>

                <div>
                  <label className={`block text-xs font-semibold uppercase tracking-wider mb-1 ${darkMode ? "text-slate-400" : "text-slate-500"}`}>
                    領収書 / 写真の添付（任意）
                  </label>
                  <input
                    id="image-input"
                    type="file"
                    accept="image/*"
                    onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                    className="w-full text-xs text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-indigo-500/10 file:text-indigo-500 hover:file:bg-indigo-500/20 cursor-pointer"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-medium py-3 rounded-xl transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <Send className="w-4 h-4" />
                  {submitting ? "送信中..." : "レポートを送信する"}
                </button>
              </form>
            </section>

            {/* 📋 履歴・フィルター */}
            <section className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <h2 className="text-lg font-bold flex items-center gap-2">
                  <Receipt className="w-5 h-5 text-indigo-500" />
                  活動レポート履歴
                </h2>

                <div className="flex items-center gap-2 flex-wrap print:hidden">
                  <select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className={`px-3 py-1.5 rounded-xl border text-xs font-medium ${
                      darkMode ? "bg-slate-900 border-slate-800 text-slate-300" : "bg-white border-slate-200 text-slate-700 shadow-sm"
                    }`}
                  >
                    <option value="all">すべてのカテゴリ</option>
                    <option value="医療費">医療費</option>
                    <option value="フード代">フード代</option>
                    <option value="猫砂・シート代">猫砂・シート代</option>
                    <option value="搬送ガソリン代">搬送ガソリン代</option>
                    <option value="その他">その他</option>
                  </select>

                  <div className={`flex items-center gap-1 p-1 rounded-xl text-xs font-medium ${darkMode ? "bg-slate-900 border border-slate-800" : "bg-slate-200/60"}`}>
                    <button onClick={() => setFilter("all")} className={`px-2.5 py-1 rounded-lg ${filter === "all" ? (darkMode ? "bg-slate-800 text-white font-bold" : "bg-white text-slate-900 shadow-sm font-bold") : "text-slate-400"}`}>すべて</button>
                    <button onClick={() => setFilter("expense")} className={`px-2.5 py-1 rounded-lg ${filter === "expense" ? "bg-rose-500/20 text-rose-400 font-bold" : "text-slate-400"}`}>経費</button>
                    <button onClick={() => setFilter("donation")} className={`px-2.5 py-1 rounded-lg ${filter === "donation" ? "bg-emerald-500/20 text-emerald-400 font-bold" : "text-slate-400"}`}>寄付</button>
                    <button onClick={() => setFilter("pending")} className={`px-2.5 py-1 rounded-lg ${filter === "pending" ? "bg-amber-500/20 text-amber-400 font-bold" : "text-slate-400"}`}>未承認</button>
                  </div>
                </div>
              </div>

              {loading ? (
                <div className={`text-center py-12 rounded-2xl border text-sm ${darkMode ? "bg-slate-900 border-slate-800 text-slate-500" : "bg-white border-slate-100 text-slate-400"}`}>読み込み中...</div>
              ) : filteredLogs.length === 0 ? (
                <div className={`text-center py-12 rounded-2xl border text-sm ${darkMode ? "bg-slate-900 border-slate-800 text-slate-500" : "bg-white border-slate-100 text-slate-400"}`}>該当する記録はありません</div>
              ) : (
                <div className="space-y-3">
                  {filteredLogs.map((log) => {
                    const isApproved = log.status === "approved";
                    const animalObj = animals.find((a) => a.id === log.animal_id);
                    return (
                      <div
                        key={log.id}
                        className={`rounded-2xl p-5 shadow-sm border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                          darkMode ? "bg-slate-900 border-slate-800 hover:border-slate-700" : "bg-white border-slate-100 hover:shadow-md"
                        }`}
                      >
                        <div className="flex items-start gap-4">
                          <div className={`p-3 rounded-xl shrink-0 ${log.type === "expense" ? "bg-rose-500/10 text-rose-500 border border-rose-500/20" : "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"}`}>
                            {log.type === "expense" ? <Wallet className="w-5 h-5" /> : <Package className="w-5 h-5" />}
                          </div>

                          <div className="space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${log.type === "expense" ? "bg-rose-500/20 text-rose-400" : "bg-emerald-500/20 text-emerald-400"}`}>
                                {log.type === "expense" ? "経費精算" : "物資寄付"}
                              </span>

                              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center gap-1">
                                <Tag className="w-2.5 h-2.5" /> {log.category || "その他"}
                              </span>

                              {animalObj && (
                                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center gap-1">
                                  {animalObj.species === "cat" ? "🐱" : "🐶"} {animalObj.name}
                                </span>
                              )}

                              <button
                                onClick={() => handleStatusChange(log.id, log.status)}
                                title={user ? "クリックしてステータスを切替" : "管理者ログインが必要です"}
                                className={`text-[10px] font-semibold px-2.5 py-1 rounded-md border flex items-center gap-1 transition-all ${
                                  isApproved ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/30" : "bg-amber-500/10 text-amber-500 border-amber-500/30"
                                }`}
                              >
                                {isApproved ? <CheckCircle2 className="w-3 h-3 text-emerald-500" /> : <Clock className="w-3 h-3 text-amber-500" />}
                                {isApproved ? "承認済み" : "確認待ち"}
                                {!user && <Lock className="w-2.5 h-2.5 ml-0.5 text-slate-500" />}
                              </button>

                              <span className="text-xs text-slate-500">
                                {new Date(log.created_at).toLocaleDateString("ja-JP")} ({log.volunteer_name || "匿名"})
                              </span>
                            </div>

                            <h3 className="font-bold">{log.title}</h3>

                            {log.details && <p className={`text-xs ${darkMode ? "text-slate-400" : "text-slate-500"}`}>{log.details}</p>}

                            {log.image_url && (
                              <div className="pt-1 print:hidden">
                                <a
                                  href={log.image_url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="inline-flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 font-medium bg-indigo-500/10 px-2.5 py-1 rounded-lg border border-indigo-500/20"
                                >
                                  <ImageIcon className="w-3.5 h-3.5" /> 添付画像を表示 <ExternalLink className="w-3 h-3" />
                                </a>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center justify-between sm:justify-end gap-4 border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-800">
                          {log.amount !== null && (
                            <div className="text-left sm:text-right">
                              <span className="text-xs text-slate-500 block">{log.type === "expense" ? "金額" : "数量"}</span>
                              <span className={`text-lg font-black ${log.type === "expense" ? "text-rose-500" : "text-emerald-500"}`}>
                                {log.type === "expense" ? `¥${log.amount.toLocaleString()}` : `${log.amount.toLocaleString()} 点`}
                              </span>
                            </div>
                          )}

                          <button
                            onClick={() => handleDelete(log.id, log.title)}
                            title={user ? "ログを削除" : "管理者ログインが必要です"}
                            className="p-2 rounded-lg text-slate-500 hover:text-rose-500 hover:bg-rose-500/10 transition-all relative print:hidden"
                          >
                            <Trash2 className="w-4 h-4" />
                            {!user && (
                              <span className="absolute -top-1 -right-1 bg-slate-800 text-slate-400 rounded-full p-0.5 border border-slate-700">
                                <Lock className="w-2.5 h-2.5" />
                              </span>
                            )}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          </div>
        )}

      </div>

      {/* 🔐 ログインモーダル */}
      {showLoginModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 z-50 print:hidden">
          <div className={`rounded-2xl p-6 max-w-md w-full shadow-xl border space-y-4 ${darkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-100"}`}>
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <Lock className="w-5 h-5 text-indigo-500" /> 管理者ログイン
              </h3>
              <button onClick={() => setShowLoginModal(false)} className="text-slate-400 hover:text-slate-200 text-sm font-bold">✕</button>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider mb-1 text-slate-400">メールアドレス</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@example.com"
                  className={`w-full px-4 py-2.5 rounded-xl border text-sm ${darkMode ? "bg-slate-800 border-slate-700 text-white" : "bg-slate-50 border-slate-200"}`}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider mb-1 text-slate-400">パスワード</label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className={`w-full px-4 py-2.5 rounded-xl border text-sm ${darkMode ? "bg-slate-800 border-slate-700 text-white" : "bg-slate-50 border-slate-200"}`}
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowLoginModal(false)}
                  className={`flex-1 font-medium py-2.5 rounded-xl text-sm ${darkMode ? "bg-slate-800 text-slate-300" : "bg-slate-100 text-slate-700"}`}
                >
                  キャンセル
                </button>
                <button
                  type="submit"
                  disabled={loginLoading}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white font-medium py-2.5 rounded-xl text-sm shadow-md disabled:opacity-50"
                >
                  {loginLoading ? "ログイン中..." : "ログイン"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}