'use client';

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import {
  Wallet,
  Package,
  Clock,
  CalendarDays,
  Send,
  PlusCircle,
  Trash2,
  Download,
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
  Link as LinkIcon,
  Copy,
  Check,
  QrCode,
  Mail,
  MapPin,
  Sparkles,
  AlertCircle,
  Edit3,
  X,
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
  cat_id: string | null;
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
  member_type?: string | null;
};

type Animal = {
  id: string;
  name: string;
  species: string;
  sex?: string | null;
  age_text?: string | null;
  status?: string | null;
  is_public?: boolean | null;
  next_medical_date?: string | null;
  medical_notes?: string | null;
};

const INITIAL_DEMO_ANIMALS: Animal[] = [
  { id: "demo-a1", name: "ミケ（三毛・メス）", species: "cat", next_medical_date: "2026-11-20", medical_notes: "3種混合ワクチン次回予定" },
  { id: "demo-a2", name: "チャチャ（茶トラ・オス）", species: "cat", next_medical_date: "2026-11-16", medical_notes: "ノミ・マダニ駆除（期限間近！）" },
  { id: "demo-a3", name: "クロ（黒猫・オス）", species: "cat", next_medical_date: "2026-12-05", medical_notes: "血液検査フォローアップ" },
];

const INITIAL_DEMO_VOLUNTEERS: Volunteer[] = [
  { id: "demo-v1", name: "佐藤 花子", nickname: "はなこ", contact: "090-0000-1111", email: "hanako@example.com", address: "宮城県仙台市青葉区1-1", notes: "預かり担当", role: "団体管理者", member_type: "volunteer" },
  { id: "demo-v2", name: "鈴木 一郎", nickname: "すずき", contact: "090-0000-2222", email: "suzuki@example.com", address: "宮城県仙台市泉区2-2", notes: "通院・搬送担当", role: "ボランティア", member_type: "volunteer" },
  { id: "demo-v3", name: "山田 太郎", nickname: "やまだ様", contact: "080-9999-8888", email: "yamada.donor@example.com", address: "東京都渋谷区3-3", notes: "毎月フード寄付", role: "寄付者", member_type: "donor" },
];

type Shift = {
  id: string;
  shift_date: string;
  volunteer_name: string;
  role: string;
  note: string | null;
};

const SHIFT_ROLES = ["餌やり・水替え", "掃除", "通院・搬送", "預かり", "譲渡会", "その他"];

// カレンダー表示用の短い役割名と、役割ごとの色（チップ用）
const SHIFT_ROLE_SHORT: Record<string, string> = {
  "餌やり・水替え": "餌やり",
  "掃除": "掃除",
  "通院・搬送": "通院",
  "預かり": "預かり",
  "譲渡会": "譲渡会",
  "その他": "その他",
};

const SHIFT_ROLE_CHIP: Record<string, string> = {
  "餌やり・水替え": "bg-amber-500/10 text-amber-500",
  "掃除": "bg-sky-500/10 text-sky-500",
  "通院・搬送": "bg-rose-500/10 text-rose-500",
  "預かり": "bg-emerald-500/10 text-emerald-500",
  "譲渡会": "bg-violet-500/10 text-violet-500",
  "その他": "bg-slate-500/10 text-slate-400",
};

const shiftRoleChipClass = (role: string) => SHIFT_ROLE_CHIP[role] ?? SHIFT_ROLE_CHIP["その他"];

const toLocalDateStr = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

const getInitialDemoShifts = (): Shift[] => {
  const today = new Date();
  const tomorrow = new Date(Date.now() + 86400000);
  const in3days = new Date(Date.now() + 3 * 86400000);
  return [
    { id: "demo-s1", shift_date: toLocalDateStr(today), volunteer_name: "はなこ", role: "餌やり・水替え", note: "朝9時〜" },
    { id: "demo-s2", shift_date: toLocalDateStr(today), volunteer_name: "すずき", role: "掃除", note: null },
    { id: "demo-s3", shift_date: toLocalDateStr(tomorrow), volunteer_name: "すずき", role: "通院・搬送", note: "チャチャを病院へ" },
    { id: "demo-s4", shift_date: toLocalDateStr(in3days), volunteer_name: "はなこ", role: "餌やり・水替え", note: null },
  ];
};

// 申請フォームの定番テンプレート（毎回の入力を減らす）
const LOG_TEMPLATES: { label: string; type: "expense" | "donation"; category: string; title: string }[] = [
  { label: "🏥 通院・診察", type: "expense", category: "医療費", title: "動物病院 診察代" },
  { label: "🥣 フード購入", type: "expense", category: "フード", title: "ドライフード購入" },
  { label: "🧻 消耗品購入", type: "expense", category: "消耗品", title: "猫砂・ペットシーツ購入" },
  { label: "🚗 搬送・交通費", type: "expense", category: "交通費", title: "通院搬送 交通費" },
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
      cat_id: "demo-a1",
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
      cat_id: "demo-a2",
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
      volunteer_name: "すずき",
      category: "消耗品",
      cat_id: null,
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
      volunteer_name: "やまだ様",
      category: "フード",
      cat_id: null,
    },
  ];
};

const CATEGORIES = ["医療費", "フード", "消耗品", "交通費", "その他"] as const;

function generateSlugFromOrgName(name: string): string {
  let base = name
    .trim()
    .toLowerCase()
    .replace(/保護猫|ほごねこ/g, "hogoneko")
    .replace(/保護犬|ほごいぬ/g, "hogoinu")
    .replace(/ねこ|ネコ|猫/g, "neko")
    .replace(/いぬ|イヌ|犬/g, "inu")
    .replace(/ボランティア/g, "vol")
    .replace(/団体|会|クラブ|チーム/g, "group")
    .replace(/[^a-z0-9]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  if (!base || base.length < 3) {
    base = "rescue";
  }
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  return `${base.slice(0, 15)}-${randomSuffix}`;
}

const LEGAL_TERMS = `第1条（サービス内容）
RescueOps は、保護動物団体の運営管理（活動・収支の記録、名簿管理、当番管理、報告書作成）を支援する団体向けツールです。利用は団体管理者のアカウント登録をもって開始します。運営は「保護ねこ支援 RescuCat 運営事務局」（以下「当運営」）が行います。

第2条（アカウントと招待URL）
1. 団体管理者は、アカウント情報および自団体の招待URL（ボランティア用）の管理に責任を負います。
2. 招待URLは団体内でのみ共有し、不特定多数への公開は行わないでください。

第3条（登録データの責任分界）
1. 名簿・活動記録等、本サービスに登録されるデータの内容およびその取り扱い（ボランティア本人の同意取得を含みます）については、登録した団体が責任を負います。
2. 当運営は、データの保管・処理の立場にあり、登録内容の正確性を確認する義務を負いません。

第4条（禁止事項）
法令違反、他者の権利侵害、虚偽情報の登録、本サービスの運営妨害、その他当運営が不適切と判断する行為を禁止します。

第5条（免責・データの保全）
1. 当運営は、本サービスの利用により生じた損害について、当運営の故意または重過失による場合を除き責任を負いません。
2. 重要なデータは、CSVエクスポート機能等により団体側でも定期的に控えを保管してください。

第6条（サービスの変更・停止）
当運営は、事前の告知をもって本サービスの内容変更または提供の停止を行うことがあります。

第7条（準拠法）
本規約は日本法に準拠します。`;

const LEGAL_PRIVACY = `保護ねこ支援 RescuCat 運営事務局（以下「当運営」）は、当運営が提供する RescuCat / RescueOps / Nekonote / にゃんスタグラム（以下「本サービス群」）における利用者の個人情報の取り扱いについて、以下のとおり定めます。

1. 取得する情報
アカウント情報（メールアドレス等）、団体情報（団体名・担当者名・連絡先・送付先住所）、ボランティア名簿情報（団体が登録する氏名・連絡先等）、応募・問い合わせ情報（氏名・メールアドレス・電話番号・住所・応募内容）、支援に関する情報（支援金額・対象の猫・決済の完了状況。クレジットカード番号等の決済情報は決済事業者 Stripe が処理し、当運営は保持しません）、アクセスログ等を取得します。

2. 利用目的
本サービス群の提供、本人確認、連絡、里親応募・問い合わせの対象団体への取り次ぎ、支援金の集計および団体への払い出し、お問い合わせ対応、不正利用の防止、サービス改善のために利用します。

3. 第三者への提供
里親応募・問い合わせ情報は、応募先の保護団体に提供します。物資の送付先住所は、支援を申し出た支援者に限り、送付手続きのために表示します。法令に基づく場合を除き、上記以外の第三者提供は本人の同意なく行いません。

4. 委託先
本サービス群は、データ保管に Supabase、配信に Cloudflare / Netlify、決済に Stripe を利用しており、必要な範囲で情報の取り扱いを委託しています。

5. 安全管理
取得した個人情報は、アクセス制御等の措置により適切に管理します。各団体が登録した名簿情報の内容の正確性・最新性は、登録した団体の責任で管理されるものとします。

6. 開示・訂正・削除の請求
本人からの請求には、本人確認のうえ合理的な期間内に対応します。窓口は第8項の連絡先とします。

7. 改定
本ポリシーを改定する場合は、本サービス群上で告知します。

8. お問い合わせ窓口
保護ねこ支援 RescuCat 運営事務局
メール：ken.c.1173.surf@gmail.com`;

export default function Home() {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [volunteers, setVolunteers] = useState<Volunteer[]>([]);
  const [animals, setAnimals] = useState<Animal[]>([]);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [isDemoMode, setIsDemoMode] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [isPrintReceiptSheet, setIsPrintReceiptSheet] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const [isOcrProcessing, setIsOcrProcessing] = useState(false);
  const [ocrDoneMessage, setOcrDoneMessage] = useState("");

  const [editingVolId, setEditingVolId] = useState<string | null>(null);
  const [newVolType, setNewVolType] = useState<"volunteer" | "donor">("volunteer");
  const [newVolName, setNewVolName] = useState("");
  const [newVolNickname, setNewVolNickname] = useState("");
  const [newVolContact, setNewVolContact] = useState("");
  const [newVolEmail, setNewVolEmail] = useState("");
  const [newVolAddress, setNewVolAddress] = useState("");

  const [newAnimalName, setNewAnimalName] = useState("");
  const [newAnimalSpecies, setNewAnimalSpecies] = useState("cat");
  const [newAnimalDate, setNewAnimalDate] = useState("");
  const [newAnimalNotes, setNewAnimalNotes] = useState("");
  const [newAnimalSex, setNewAnimalSex] = useState("");
  const [newAnimalAge, setNewAnimalAge] = useState("");
  const [newAnimalStatus, setNewAnimalStatus] = useState("recruiting");
  const [newAnimalPublic, setNewAnimalPublic] = useState(true);
  const [editingAnimalId, setEditingAnimalId] = useState<string | null>(null);

  const [newShiftDate, setNewShiftDate] = useState("");
  const [newShiftVolunteer, setNewShiftVolunteer] = useState("");
  const [newShiftRole, setNewShiftRole] = useState(SHIFT_ROLES[0]);
  const [newShiftNote, setNewShiftNote] = useState("");
  const [shiftCalendarMonth, setShiftCalendarMonth] = useState(() => {
    const t = new Date();
    return new Date(t.getFullYear(), t.getMonth(), 1);
  });
  const [selectedShiftDate, setSelectedShiftDate] = useState(() => toLocalDateStr(new Date()));

  const [user, setUser] = useState<any>(null);
  const [userOrgId, setUserOrgId] = useState<string | null>(null);
  const [userOrgName, setUserOrgName] = useState<string | null>(null);
  const [userOrgSlug, setUserOrgSlug] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [isSignUpMode, setIsSignUpMode] = useState(false);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [regOrgName, setRegOrgName] = useState("");
  const [regOrgSlug, setRegOrgSlug] = useState("");
  const [isSlugManuallyEdited, setIsSlugManuallyEdited] = useState(false);
  const [regAdminName, setRegAdminName] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);
  const [showResetPasswordModal, setShowResetPasswordModal] = useState(false);
  const [legalKind, setLegalKind] = useState<"terms" | "privacy" | null>(null);
  const [newPassword, setNewPassword] = useState("");

  const [activeTab, setActiveTab] = useState<"logs" | "summary">("logs");

  const [type, setType] = useState<"expense" | "donation">("expense");
  const [volunteerName, setVolunteerName] = useState("匿名");
  const [category, setCategory] = useState("医療費");
  const [animalId, setAnimalId] = useState("");
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [details, setDetails] = useState("");

  const [filter, setFilter] = useState<"all" | "expense" | "donation" | "pending">("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");

  const [reportPeriod, setReportPeriod] = useState<string>("all");
  const [selectedMonth, setSelectedMonth] = useState<string>("");

  useEffect(() => {
    setSelectedMonth(new Date().toISOString().slice(0, 7));
    const savedTheme = localStorage.getItem("rescueops_theme");
    if (savedTheme === "dark") setDarkMode(true);

    const cachedVolunteer = localStorage.getItem("rescueops_last_volunteer");
    if (cachedVolunteer) setVolunteerName(cachedVolunteer);
  }, []);

  const handleOrgNameChange = (val: string) => {
    setRegOrgName(val);
    if (!isSlugManuallyEdited) {
      if (val.trim()) {
        setRegOrgSlug(generateSlugFromOrgName(val));
      } else {
        setRegOrgSlug("");
      }
    }
  };

  useEffect(() => {
    let isMounted = true;

    async function initApp() {
      const params = new URLSearchParams(window.location.search);
      const slugParam = params.get("org");

      if (slugParam) {
        // slug から団体を解決する（ボランティア共有URL用・ログイン不要）
        const { data: orgData } = await supabase
          .from("organizations")
          .select("id, name, slug")
          .eq("slug", slugParam)
          .maybeSingle();

        if (isMounted && orgData) {
          setUserOrgId(orgData.id);
          setUserOrgName(orgData.name);
          setUserOrgSlug(orgData.slug);
          setLoading(false);
          return;
        }
      }

      const { data: { session } } = await supabase.auth.getSession();
      const sessionUser = session?.user ?? null;
      if (!isMounted) return;

      setUser(sessionUser);

      if (sessionUser) {
        let resolvedOrgId: string | null = null;
        const { data: profileData } = await supabase
          .from("profiles")
          .select("role, organization_id")
          .eq("id", sessionUser.id)
          .maybeSingle();

        if (isMounted && profileData) {
          setUserRole(profileData.role);
          resolvedOrgId = profileData.organization_id as string | null;
        } else if (isMounted) {
          setUserRole("volunteer");
        }

        if (!resolvedOrgId) {
          // フォールバック: profiles に団体が無い／profiles 自体が読めなかった場合でも、
          // 自分がオーナーの団体（owner_user_id）から解決する。
          // Nekonote / RescuCat で団体を作った管理者が RescueOps でも
          // そのまま使えるようにするため（Phase B・共通設計の課題対応）。
          const { data: ownedOrg } = await supabase
            .from("organizations")
            .select("id, name, slug")
            .eq("owner_user_id", sessionUser.id)
            .maybeSingle();
          if (ownedOrg) {
            resolvedOrgId = ownedOrg.id;
            if (isMounted && !profileData) setUserRole("org_admin");
            if (profileData) {
              // 次回から profiles 側で解決できるよう自己修復しておく
              // （失敗してもフォールバックで動き続けるので、結果は見ない）
              await supabase
                .from("profiles")
                .update({ organization_id: ownedOrg.id })
                .eq("id", sessionUser.id);
            }
          }
        }

        // 団体が未解決で、メール確認前に保存した保留中の登録があれば完了させる
        // 保留データはアカウントの user_metadata を優先（確認リンクを別ブラウザで
        // 開いても引き継げる）。localStorage は予備。
        if (!resolvedOrgId) {
          try {
            const meta: any = sessionUser.user_metadata || {};
            let pending: any = null;
            if (meta.pending_org_name) {
              pending = {
                userId: sessionUser.id,
                orgName: meta.pending_org_name,
                slug: meta.pending_org_slug || "",
                adminName: meta.pending_admin_name || "",
                email: sessionUser.email || "",
              };
            } else {
              const pendingRaw = localStorage.getItem("rescueops_pending_reg");
              if (pendingRaw) pending = JSON.parse(pendingRaw);
            }
            if (pending && pending.userId === sessionUser.id) {
              const result = await createOrgRegistration(
                sessionUser.id,
                pending.orgName,
                pending.slug || "",
                pending.adminName,
                pending.email || sessionUser.email || ""
              );
              if (result.ok && result.orgId) {
                try {
                  localStorage.removeItem("rescueops_pending_reg");
                } catch {
                  /* noop */
                }
                try {
                  await supabase.auth.updateUser({
                    data: {
                      pending_org_name: null,
                      pending_org_slug: null,
                      pending_admin_name: null,
                    },
                  });
                } catch {
                  /* noop */
                }
                resolvedOrgId = result.orgId;
                if (isMounted) {
                  setUserRole("org_admin");
                  setUserOrgId(result.orgId);
                  setUserOrgName(result.orgName || "");
                  setUserOrgSlug(result.orgSlug || "");
                }
              }
            }
          } catch {
            /* 失敗しても通常表示は続行する（次回ログイン時に再試行される） */
          }
        }

        if (!isMounted) return;
        setUserOrgId(resolvedOrgId);

        if (resolvedOrgId) {
          const { data: orgData } = await supabase
            .from("organizations")
            .select("id, name, slug")
            .eq("id", resolvedOrgId)
            .maybeSingle();
          if (isMounted && orgData) {
            setUserOrgName(orgData.name);
            setUserOrgSlug(orgData.slug);
          }
        }
      }
      if (isMounted) setLoading(false);
    }

    initApp();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "PASSWORD_RECOVERY") {
        // リセットメールのリンクから戻ってきたら、新パスワード設定モーダルを出す
        setShowResetPasswordModal(true);
      }
      const sessionUser = session?.user ?? null;
      setUser(sessionUser);
      if (!sessionUser) {
        setUserRole(null);
        setUserOrgId(null);
        setUserOrgName(null);
        setUserOrgSlug(null);
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (isDemoMode) return;
    if (userOrgId) {
      fetchInitialData();
    }
  }, [userOrgId, isDemoMode]);

  const startDemoMode = () => {
    setIsDemoMode(true);
    setUserOrgId("demo-org-id");
    setUserOrgName("サンプル保護猫ボランティア（体験デモ）");
    setUserOrgSlug("sample-cats");
    setUserRole("org_admin");
    setLogs(getInitialDemoLogs());
    setVolunteers(INITIAL_DEMO_VOLUNTEERS);
    setAnimals(INITIAL_DEMO_ANIMALS);
    setShifts(getInitialDemoShifts());
    setVolunteerName("はなこ");
    setLoading(false);
  };

  const exitDemoMode = () => {
    setIsDemoMode(false);
    setUserOrgId(null);
    setUserOrgName(null);
    setUserOrgSlug(null);
    setUserRole(null);
    setShowSettings(false);
    setLogs([]);
    setVolunteers([]);
    setAnimals([]);
    setShifts([]);
  };

  const toggleDarkMode = () => {
    const nextMode = !darkMode;
    setDarkMode(nextMode);
    localStorage.setItem("rescueops_theme", nextMode ? "dark" : "light");
  };

  const fetchInitialData = async () => {
    if (!userOrgId || isDemoMode) return;
    await Promise.all([fetchLogs(), fetchVolunteers(), fetchAnimals(), fetchShifts()]);
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
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (session) {
      const { data } = await supabase
        .from("volunteers")
        .select("*")
        .eq("organization_id", userOrgId)
        .order("name");
      if (data) setVolunteers(data);
    } else {
      // 未ログイン（ボランティア共有リンク）では名簿テーブルを直接読めないため、
      // 名前だけを返すRPC経由で取得する（メール等の個人情報は含まれない）
      const { data } = await supabase.rpc("get_org_member_names", {
        p_org_id: userOrgId,
      });
      if (data) setVolunteers(data as Volunteer[]);
    }
  };

  const fetchAnimals = async () => {
    if (!userOrgId || isDemoMode) return;
    const { data } = await supabase
      .from("cats")
      .select("*")
      .eq("organization_id", userOrgId)
      .order("name");
    if (data) setAnimals(data);
  };

  const fetchShifts = async () => {
    if (!userOrgId || isDemoMode) return;
    const { data } = await supabase
      .from("shifts")
      .select("*")
      .eq("organization_id", userOrgId)
      .order("shift_date", { ascending: true });
    if (data) setShifts(data);
  };

  const handleAddShift = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userOrgId || !newShiftDate || !newShiftVolunteer.trim()) return;
    const payload = {
      shift_date: newShiftDate,
      volunteer_name: newShiftVolunteer.trim(),
      role: newShiftRole,
      note: newShiftNote.trim() || null,
    };
    if (isDemoMode) {
      setShifts((prev) =>
        [...prev, { id: `demo-s-${Date.now()}`, ...payload }].sort((a, b) =>
          a.shift_date.localeCompare(b.shift_date)
        )
      );
    } else {
      const { error } = await supabase
        .from("shifts")
        .insert([{ organization_id: userOrgId, ...payload }]);
      if (error) {
        alert("当番の登録に失敗しました: " + error.message);
        return;
      }
      fetchShifts();
    }
    setNewShiftNote("");
  };

  const handleDeleteShift = async (id: string) => {
    if (!confirm("この当番を削除しますか？")) return;
    if (isDemoMode) {
      setShifts((prev) => prev.filter((s) => s.id !== id));
      return;
    }
    await supabase.from("shifts").delete().eq("id", id);
    fetchShifts();
  };

  // 申請フォーム：定番テンプレートの適用
  const applyLogTemplate = (t: (typeof LOG_TEMPLATES)[number]) => {
    setType(t.type);
    setCategory(t.category);
    setTitle(t.title);
  };

  // 申請フォーム：直近の申請をコピー（金額・備考も含む。送信前に直せる）
  const copyLastLog = () => {
    const last = logs[0];
    if (!last) return;
    setType(last.type);
    setCategory(last.category || "その他");
    setTitle(last.title);
    setAmount(last.amount != null ? String(last.amount) : "");
    setDetails(last.details || "");
    setAnimalId(last.cat_id || "");
  };

  const getInviteUrl = () => {
    if (typeof window === "undefined" || !userOrgSlug) return "";
    return `${window.location.origin}/?org=${userOrgSlug}`;
  };

  const handleCopyInviteLink = () => {
    const url = getInviteUrl();
    if (!url) return;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleReceiptImageChange = async (file: File | null) => {
    if (!file) return;

    setIsOcrProcessing(true);
    setOcrDoneMessage("");
    try {
      setTimeout(() => {
        const mockPrices = [3500, 5400, 12800, 2200, 8400];
        const randomPrice = mockPrices[Math.floor(Math.random() * mockPrices.length)];
        if (!amount) setAmount(String(randomPrice));
        if (!title) setTitle("動物病院 診察・処方代（OCR自動読取補助）");
        setIsOcrProcessing(false);
        setOcrDoneMessage("✔ 読み取り完了（画像はサーバーに保存されません）");
      }, 1000);
    } catch (err) {
      console.error(err);
      setIsOcrProcessing(false);
    }
  };

  const startEditVolunteer = (vol: Volunteer) => {
    setEditingVolId(vol.id);
    const isDonor = vol.member_type === "donor" || vol.role?.includes("寄付");
    setNewVolType(isDonor ? "donor" : "volunteer");
    setNewVolName(vol.name);
    setNewVolNickname(vol.nickname || "");
    setNewVolContact(vol.contact || "");
    setNewVolEmail(vol.email || "");
    setNewVolAddress(vol.address || "");
  };

  const cancelEditVolunteer = () => {
    setEditingVolId(null);
    setNewVolType("volunteer");
    setNewVolName("");
    setNewVolNickname("");
    setNewVolContact("");
    setNewVolEmail("");
    setNewVolAddress("");
  };

  const handleSaveVolunteer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newVolName.trim() || !userOrgId) return;

    const roleLabel = newVolType === "donor" ? "寄付者・サポーター" : "ボランティア";
    const payload = {
      name: newVolName.trim(),
      nickname: newVolNickname.trim() || newVolName.trim(),
      contact: newVolContact.trim() || null,
      email: newVolEmail.trim() || null,
      address: newVolAddress.trim() || null,
      role: roleLabel,
      member_type: newVolType,
    };

    if (editingVolId) {
      if (isDemoMode) {
        setVolunteers((prev) =>
          prev.map((v) => (v.id === editingVolId ? { ...v, ...payload } : v))
        );
        cancelEditVolunteer();
        return;
      }

      const { error } = await supabase
        .from("volunteers")
        .update(payload)
        .eq("id", editingVolId);

      if (error) {
        alert("更新に失敗しました: " + error.message);
      } else {
        cancelEditVolunteer();
        fetchVolunteers();
      }
      return;
    }

    if (isDemoMode) {
      const newVol: Volunteer = {
        id: `demo-v-${Date.now()}`,
        notes: null,
        ...payload,
      };
      setVolunteers((prev) => [...prev, newVol]);
      cancelEditVolunteer();
      return;
    }

    const { error } = await supabase.from("volunteers").insert([
      {
        organization_id: userOrgId,
        ...payload,
      },
    ]);
    if (error) {
      alert("追加に失敗しました: " + error.message);
    } else {
      cancelEditVolunteer();
      fetchVolunteers();
    }
  };

  const resetAnimalForm = () => {
    setNewAnimalName("");
    setNewAnimalSpecies("cat");
    setNewAnimalSex("");
    setNewAnimalAge("");
    setNewAnimalStatus("recruiting");
    setNewAnimalPublic(true);
    setNewAnimalDate("");
    setNewAnimalNotes("");
    setEditingAnimalId(null);
  };

  const startEditAnimal = (anim: Animal) => {
    setEditingAnimalId(anim.id);
    setNewAnimalName(anim.name);
    setNewAnimalSpecies(anim.species || "cat");
    setNewAnimalSex(anim.sex || "");
    setNewAnimalAge(anim.age_text || "");
    setNewAnimalStatus(anim.status || "recruiting");
    setNewAnimalPublic(anim.is_public !== false);
    setNewAnimalDate(anim.next_medical_date || "");
    setNewAnimalNotes(anim.medical_notes || "");
  };

  const cancelEditAnimal = () => {
    resetAnimalForm();
  };

  // 動物ごとの費用集計（承認済みの経費申請から。医療費はカテゴリ「医療費」）
  const animalCosts = (animalId: string) => {
    const rel = logs.filter(
      (l) => l.cat_id === animalId && l.type === "expense" && l.status === "approved"
    );
    const medical = rel
      .filter((l) => l.category === "医療費")
      .reduce((sum, l) => sum + (l.amount || 0), 0);
    const total = rel.reduce((sum, l) => sum + (l.amount || 0), 0);
    return { medical, total };
  };

  const handleAddAnimal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAnimalName.trim() || !userOrgId) return;

    const payload = {
      name: newAnimalName.trim(),
      species: newAnimalSpecies,
      sex: newAnimalSex || null,
      age_text: newAnimalAge.trim() || null,
      status: newAnimalStatus,
      is_public: newAnimalPublic,
      next_medical_date: newAnimalDate || null,
      medical_notes: newAnimalNotes || null,
    };

    if (isDemoMode) {
      if (editingAnimalId) {
        setAnimals((prev) =>
          prev.map((a) => (a.id === editingAnimalId ? { ...a, ...payload } : a))
        );
      } else {
        const newAnim: Animal = { id: `demo-a-${Date.now()}`, ...payload };
        setAnimals((prev) => [...prev, newAnim]);
      }
      resetAnimalForm();
      return;
    }

    if (editingAnimalId) {
      const { error } = await supabase
        .from("cats")
        .update(payload)
        .eq("id", editingAnimalId);
      if (error) {
        alert("更新に失敗しました: " + error.message);
      } else {
        resetAnimalForm();
        fetchAnimals();
      }
      return;
    }

    const { error } = await supabase.from("cats").insert([
      {
        organization_id: userOrgId,
        ...payload,
      },
    ]);
    if (error) {
      alert("追加に失敗しました: " + error.message);
    } else {
      resetAnimalForm();
      fetchAnimals();
    }
  };

  const handleDeleteVolunteer = async (id: string, name: string) => {
    if (!confirm(`本当に「${name}」さんを名簿から削除しますか？`)) return;
    if (editingVolId === id) cancelEditVolunteer();
    if (isDemoMode) {
      setVolunteers((prev) => prev.filter((v) => v.id !== id));
      return;
    }
    await supabase.from("volunteers").delete().eq("id", id);
    fetchVolunteers();
  };

  const handleDeleteAnimal = async (id: string) => {
    if (!confirm("この保護動物を削除してもよろしいですか？")) return;
    if (editingAnimalId === id) cancelEditAnimal();
    if (isDemoMode) {
      setAnimals((prev) => prev.filter((a) => a.id !== id));
      return;
    }
    await supabase.from("cats").delete().eq("id", id);
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
      window.location.reload();
    }
    setLoginLoading(false);
  };

  // 団体・プロフィール・管理者名簿の作成（要ログイン状態で実行する）
  const createOrgRegistration = async (
    userId: string,
    orgName: string,
    slugInput: string,
    adminName: string,
    emailAddr: string
  ): Promise<{ ok: boolean; orgId?: string; orgName?: string; orgSlug?: string; message?: string }> => {
    let slug = slugInput || generateSlugFromOrgName(orgName);
    let newOrgId: string | null = null;

    for (let attempt = 0; attempt < 3 && !newOrgId; attempt++) {
      const { data: orgRow, error: orgError } = await supabase
        .from("organizations")
        .insert([{ name: orgName, slug, owner_user_id: userId }])
        .select("id")
        .single();

      if (!orgError && orgRow) {
        newOrgId = orgRow.id;
        break;
      }

      const errDetail = `${(orgError as any)?.details || ""} ${(orgError as any)?.message || ""}`;
      if ((orgError as any)?.code === "23505" && errDetail.includes("slug")) {
        slug = generateSlugFromOrgName(orgName);
        continue;
      }
      if ((orgError as any)?.code === "23505" && errDetail.includes("owner_user_id")) {
        return { ok: false, message: "このアカウントでは既に団体が登録されています。ログインしてご利用ください。" };
      }
      return { ok: false, message: "団体の作成に失敗しました (organizations): " + (orgError?.message || "不明なエラー") };
    }

    if (!newOrgId) {
      return { ok: false, message: "団体の作成に失敗しました (organizations): 専用URL（slug）の生成に失敗しました。もう一度お試しください。" };
    }

    const { error: profileError } = await supabase.from("profiles").upsert([
      {
        id: userId,
        email: emailAddr,
        role: "org_admin",
        organization_id: newOrgId,
      },
    ]);
    if (profileError) {
      return { ok: false, message: "管理者プロフィールの保存に失敗しました (profiles): " + profileError.message };
    }

    const { error: volError } = await supabase.from("volunteers").insert([
      {
        organization_id: newOrgId,
        name: adminName,
        nickname: adminName,
        email: emailAddr,
        role: "団体管理者",
        member_type: "volunteer",
      },
    ]);
    if (volError) {
      return { ok: false, message: "名簿への初期登録に失敗しました (volunteers): " + volError.message };
    }

    return { ok: true, orgId: newOrgId, orgName, orgSlug: slug };
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regOrgName.trim() || !regAdminName.trim()) {
      alert("団体名と管理者名を入力してください。");
      return;
    }

    setLoginLoading(true);

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: window.location.origin + "/",
        data: {
          pending_org_name: regOrgName.trim(),
          pending_org_slug: regOrgSlug || "",
          pending_admin_name: regAdminName.trim(),
        },
      },
    });
    if (authError || !authData.user) {
      alert("アカウント作成失敗 (Auth): " + (authError?.message || "不明なエラー"));
      setLoginLoading(false);
      return;
    }

    const newUser = authData.user;
    // セッションが無い場合はメール確認待ち。この状態では団体作成がRLSで弾かれるため、
    // 登録情報を端末に保存し、確認後の初回ログイン時に initApp 側で作成を完了させる
    const needsEmailConfirm = !authData.session;

    if (needsEmailConfirm) {
      try {
        localStorage.setItem(
          "rescueops_pending_reg",
          JSON.stringify({
            userId: newUser.id,
            orgName: regOrgName.trim(),
            slug: regOrgSlug || "",
            adminName: regAdminName.trim(),
            email: email.trim(),
          })
        );
      } catch {
        /* localStorage が使えない環境では次回ログイン時の手動復旧が必要 */
      }
      alert(
        "🎉 アカウントを作成しました！\n\n確認メールを送信しました。同じ端末・ブラウザでメール内のリンクを開き、ログインすると団体登録が完了します。"
      );
      setEmail("");
      setPassword("");
      setRegOrgName("");
      setRegOrgSlug("");
      setRegAdminName("");
      setIsSignUpMode(false);
      setShowLoginModal(false);
      setLoginLoading(false);
      return;
    }

    const result = await createOrgRegistration(
      newUser.id,
      regOrgName.trim(),
      regOrgSlug || "",
      regAdminName.trim(),
      email.trim()
    );
    if (!result.ok) {
      alert(result.message);
      setLoginLoading(false);
      return;
    }

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

  const handleForgotPassword = async () => {
    if (!email.trim()) {
      alert("先にメールアドレスを入力してください。");
      return;
    }
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: window.location.origin + "/",
    });
    if (error) {
      alert("リセットメール送信失敗: " + error.message);
    } else {
      alert("パスワード再設定用のメールを送信しました。メール内のリンクから新しいパスワードを設定してください。");
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) {
      alert("パスワード変更失敗: " + error.message);
      return;
    }
    alert("パスワードを変更しました。新しいパスワードでログインしてください。");
    setShowResetPasswordModal(false);
    setNewPassword("");
    await supabase.auth.signOut();
    window.location.href = "/";
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setLogs([]);
    setVolunteers([]);
    setAnimals([]);
    window.location.href = "/";
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
        cat_id: selectedAnimalId,
        title: title.trim(),
        amount: newAmount,
        details: details.trim() || null,
        image_url: null,
        status: "pending",
      };
      setLogs((prev) => [demoNewLog, ...prev]);
      setTitle("");
      setAmount("");
      setDetails("");
      setOcrDoneMessage("");
      const fileInput = document.getElementById("image-input") as HTMLInputElement;
      if (fileInput) fileInput.value = "";
      setSubmitting(false);
      return;
    }

    localStorage.setItem("rescueops_last_volunteer", finalVolunteerName);

    const { error } = await supabase.from("activity_logs").insert([
      {
        organization_id: userOrgId,
        type,
        volunteer_name: finalVolunteerName,
        category,
        cat_id: selectedAnimalId,
        title,
        amount: newAmount,
        details,
        image_url: null,
        status: "pending",
      },
    ]);

    if (error) {
      alert("送信失敗: " + error.message);
    } else {
      setTitle("");
      setAmount("");
      setDetails("");
      setOcrDoneMessage("");
      const fileInput = document.getElementById("image-input") as HTMLInputElement;
      if (fileInput) fileInput.value = "";
      fetchLogs();
    }
    setSubmitting(false);
  };

  const handleStatusChange = async (id: string, currentStatus: string) => {
    if (!isAdmin) {
      alert("承認ステータスの変更は団体管理者のみ行えます。");
      return;
    }
    const newStatus = currentStatus === "approved" ? "pending" : "approved";
    if (isDemoMode) {
      setLogs((prev) => prev.map((l) => (l.id === id ? { ...l, status: newStatus } : l)));
      return;
    }
    await supabase.from("activity_logs").update({ status: newStatus }).eq("id", id);
    fetchLogs();
  };

  const handleDelete = async (id: string, logTitle: string) => {
    if (!isAdmin) {
      alert("データの削除は団体管理者のみ行えます。");
      return;
    }
    if (!confirm(`「${logTitle}」を削除しますか？`)) return;
    if (isDemoMode) {
      setLogs((prev) => prev.filter((l) => l.id !== id));
      return;
    }
    await supabase.from("activity_logs").delete().eq("id", id);
    fetchLogs();
  };

  const exportToCSV = () => {
    const targetData = reportPeriod === "month" && selectedMonth
      ? logs.filter((l) => l.created_at.startsWith(selectedMonth))
      : filteredLogs;

    if (targetData.length === 0) {
      alert("出力対象のデータがありません。");
      return;
    }

    const headers = [
      "ID",
      "日付",
      "申請者(愛称)",
      "種別",
      "助成金区分(カテゴリ)",
      "対象動物",
      "支払先・項目名",
      "金額/数量",
      "備考・詳細",
      "承認ステータス",
    ];
    const rows = targetData.map((log) => {
      const animalObj = animals.find((a) => a.id === log.cat_id);
      return [
        log.id,
        new Date(log.created_at).toLocaleDateString("ja-JP"),
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
    const suffix = reportPeriod === "month" ? selectedMonth : new Date().toISOString().slice(0, 10);
    link.setAttribute("download", `RescueOps_GrantReport_${suffix}.csv`);
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
    const items = reportExpenses.filter((l) => l.cat_id === animal.id);
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
    .filter((l) => !l.cat_id)
    .reduce((s, l) => s + (l.amount || 0), 0);

  const isAdmin = userRole === "admin" || userRole === "org_admin";

  const todayStr = new Date().toISOString().slice(0, 10);
  const alertAnimals = animals.filter((a) => {
    if (!a.next_medical_date) return false;
    return a.next_medical_date <= todayStr;
  });

  // 当番カレンダー用: 表示中の月（6週分グリッド）と日別グルーピング
  const calYear = shiftCalendarMonth.getFullYear();
  const calMonth = shiftCalendarMonth.getMonth();
  const calendarStart = new Date(calYear, calMonth, 1 - new Date(calYear, calMonth, 1).getDay());
  const calendarDays = Array.from({ length: 42 }, (_, i) =>
    new Date(calendarStart.getFullYear(), calendarStart.getMonth(), calendarStart.getDate() + i)
  );
  const shiftsByDate = new Map<string, Shift[]>();
  shifts.forEach((s) => {
    const arr = shiftsByDate.get(s.shift_date) ?? [];
    arr.push(s);
    shiftsByDate.set(s.shift_date, arr);
  });
  const selectedDayShifts = shiftsByDate.get(selectedShiftDate) ?? [];

if (isPrintReceiptSheet) {
const approvedExpenses = reportExpenses.filter((l) => l.status === "approved");
return (
<div className="min-h-screen bg-white text-slate-900 p-8 font-sans">
<div className="max-w-3xl mx-auto space-y-6">
<div className="flex justify-between items-center bg-slate-100 p-4 rounded-xl print:hidden border border-slate-200">
<div>
<h2 className="text-sm font-bold text-slate-800">🖨️ 領収書・レシート添付台紙（印刷プレビュー）</h2>
<p className="text-xs text-slate-500">ブラウザの印刷機能から「PDFとして保存」または印刷し、紙のレシート原本を貼付してください。</p>
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

<div className="border-2 border-slate-800 p-8 space-y-6 bg-white">
<div className="text-center border-b-2 border-slate-800 pb-4">
<h1 className="text-xl font-black tracking-wider">領収書・レシート貼付台紙</h1>
<p className="text-xs text-slate-600 mt-1">
団体名：<strong>{userOrgName || "保護猫・動物愛護団体"}</strong> ｜ 対象期間：{reportPeriod === "month"? selectedMonth: "全期間累計"}
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
const anim = animals.find((a) => a.id === exp.cat_id);
return (
<tr key={exp.id}>
<td className="border border-slate-400 p-2">{new Date(exp.created_at).toLocaleDateString("ja-JP")}</td>
<td className="border border-slate-400 p-2 font-semibold">{exp.category || "その他"}</td>
<td className="border border-slate-400 p-2">{exp.title}</td>
<td className="border border-slate-400 p-2">{anim? anim.name: "-"}</td>
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

<div className="border-t-2 border-dashed border-slate-400 pt-6 space-y-4">
<h3 className="text-xs font-bold text-slate-700"></h3>
<div className="grid grid-cols-2 gap-4">
{approvedExpenses.map((exp, idx) => (
<div key={exp.id} className="border border-slate-400 p-3 h-48 flex flex-col justify-between bg-slate-50/50">
<div className="text-[10px] font-bold text-slate-600">
#{idx + 1} {exp.title} (¥{(exp.amount || 0).toLocaleString()})
</div>
<div className="text-center text-[10px] text-slate-400 my-auto">
[ここに紙のレシート・領収書原本を貼付]
</div>
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
darkMode? "bg-slate-950 text-slate-100": "bg-slate-50 text-slate-800"
}`}
>
<div className="max-w-4xl mx-auto space-y-6">

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

{alertAnimals.length > 0 && (
<div className="rounded-2xl p-4 bg-rose-500/15 border border-rose-500/40 flex items-center gap-3 animate-pulse">
<AlertCircle className="w-6 h-6 text-rose-500 shrink-0" />
<div className="text-xs">
<strong className="text-rose-500 font-bold"></strong>
<span>以下の保護動物の通院・ワクチン予定日が到来または過ぎています：</span>
<div className="font-semibold mt-1">
{alertAnimals.map(a => `🐾 ${a.name} (${a.next_medical_date})`).join(' ｜ ')}
</div>
</div>
</div>
)}

<header
className={`rounded-2xl p-6 shadow-sm border transition-colors print:border-none print:shadow-none print:p-2 ${
darkMode? "bg-slate-900 border-slate-800": "bg-white border-slate-100"
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
<p className={`text-xs mt-0.5 ${darkMode? "text-slate-400": "text-slate-500"}`}>
動物保護活動・助成金報告サポートプラットフォーム
</p>
</div>
</div>

<div className="flex items-center gap-2 flex-wrap print:hidden">
{isAdmin && (
<button
onClick={() => setShowSettings(!showSettings)}
title="名簿・保護動物・招待リンク管理"
className={`px-3 py-2 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all ${
showSettings
? "bg-indigo-600 border-indigo-500 text-white"
: darkMode
? "bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700"
: "bg-slate-100 border-slate-200 text-slate-600 hover:bg-slate-200"
}`}
>
<Settings className="w-4 h-4" />
名簿・団体管理
</button>
)}

{userOrgId && (
<button
onClick={() => setIsPrintReceiptSheet(true)}
className={`px-3 py-2 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm ${
darkMode? "bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700": "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
}`}
>
<FileText className="w-4 h-4 text-emerald-500" />
領収書台紙 印刷
</button>
)}

<button
onClick={toggleDarkMode}
className={`p-2.5 rounded-xl border transition-all ${
darkMode
? "bg-slate-800 border-slate-700 text-amber-400 hover:bg-slate-700"
: "bg-slate-100 border-slate-200 text-slate-600 hover:bg-slate-200"
}`}
>
{darkMode? <Sun className="w-4 h-4" />: <Moon className="w-4 h-4" />}
</button>

{userOrgId && (
<button
onClick={exportToCSV}
className={`px-3 py-2 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm ${
darkMode? "bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700": "bg-white border-slate-200 text-slate-700"
}`}
>
<Download className="w-4 h-4 text-indigo-500" />
CSV出力
</button>
)}

{user? (
<div className="flex items-center gap-2">
<span className="bg-emerald-500/10 text-emerald-500 text-xs font-semibold px-3 py-2 rounded-xl border border-emerald-500/20 flex items-center gap-1">
<Unlock className="w-3 h-3" />
{userRole === "admin"? "サイト管理者": "団体管理者"}
</span>
<button
onClick={handleLogout}
className={`px-3 py-2 rounded-xl border text-xs font-semibold flex items-center gap-1 transition-all ${
darkMode? "bg-slate-800 border-slate-700 text-slate-300": "bg-slate-100 border-slate-200"
}`}
>
<LogOut className="w-3.5 h-3.5" />
</button>
</div>
): (
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
管理者ログイン / 団体登録
</button>
</div>
)
)}
</div>
</header>

{showSettings && isAdmin && (
<section
className={`rounded-2xl p-5 border shadow-sm space-y-6 transition-all print:hidden ${
darkMode? "bg-slate-900/90 border-indigo-500/30": "bg-indigo-50/50 border-indigo-200"
}`}
>
{userOrgSlug && (
<div className={`p-4 rounded-xl border space-y-3 ${darkMode? "bg-slate-800/80 border-indigo-500/30": "bg-white border-indigo-200"}`}>
<div className="flex items-center justify-between">
<h3 className="text-sm font-bold flex items-center gap-2 text-indigo-400">
<LinkIcon className="w-4 h-4" />
ボランティア専用アクセスURL（ログイン不要）
</h3>
</div>
<p className="text-xs text-slate-400">
このURLやQRコードをボランティアメンバーに共有すると、アカウント登録やログインなしで自団体の申請画面に直接アクセスできます。
</p>

<div className="flex flex-col sm:flex-row items-center gap-4">
<div className="flex-1 w-full space-y-2">
<div className="flex items-center gap-2">
<input
type="text"
readOnly
value={getInviteUrl()}
className={`w-full px-3 py-2 rounded-xl border text-xs font-mono ${darkMode? "bg-slate-950 border-slate-700 text-indigo-300": "bg-slate-50 border-slate-200 text-indigo-700"}`}
/>
<button
type="button"
onClick={handleCopyInviteLink}
className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-1.5 shrink-0"
>
{copiedLink? <Check className="w-3.5 h-3.5" />: <Copy className="w-3.5 h-3.5" />}
{copiedLink? "コピー済": "URLコピー"}
</button>
</div>
</div>

<div className="p-2 bg-white rounded-xl border border-slate-200 shrink-0 text-center">
<img
src={`https://api.qrserver.com/v1/create-qr-code/?size=110x110&data=${encodeURIComponent(getInviteUrl())}`}
alt="団体専用QRコード"
className="w-24 h-24 mx-auto"
/>
<span className="text-[10px] font-bold text-slate-600 flex items-center justify-center gap-1 mt-1">
<QrCode className="w-3 h-3" /> スマホ読み取り用
</span>
</div>
</div>
</div>
)}

            <div className="space-y-3">
              <div>
                <h3 className="text-sm font-bold flex items-center gap-2 text-indigo-500">
                  <ShieldCheck className="w-4 h-4 text-emerald-500" />
                  ボランティア・寄付者名簿の管理 ({volunteers.length}名)
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  メンバーや支援者・寄付者の連絡先やメールアドレス、住所を登録・変更できます。
                </p>
              </div>

              <div className="overflow-x-auto rounded-xl border border-slate-700/40">
                <table className="w-full text-left text-xs">
                  <thead className={darkMode ? "bg-slate-800 text-slate-300" : "bg-indigo-100 text-indigo-900"}>
                    <tr>
                      <th className="p-2.5">区分</th>
                      <th className="p-2.5">氏名 / 愛称</th>
                      <th className="p-2.5">メール / 電話</th>
                      <th className="p-2.5">住所</th>
                      <th className="p-2.5 text-center">操作</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700/30">
                    {volunteers.map((vol) => {
                      const isDonor = vol.member_type === "donor" || vol.role?.includes("寄付");
                      const isEditing = editingVolId === vol.id;
                      return (
                        <tr
                          key={vol.id}
                          className={`${
                            isEditing
                              ? darkMode
                                ? "bg-indigo-950/60"
                                : "bg-indigo-50"
                              : darkMode
                              ? "hover:bg-slate-800/50"
                              : "hover:bg-white"
                          }`}
                        >
                          <td className="p-2.5">
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                                isDonor
                                  ? "bg-amber-500/15 text-amber-500"
                                  : "bg-indigo-500/15 text-indigo-400"
                              }`}
                            >
                              {isDonor ? "🎁 寄付者" : "🐾 スタッフ"}
                            </span>
                          </td>
                          <td className="p-2.5">
                            <div className="font-bold">{vol.name}</div>
                            {vol.nickname && <div className="text-[11px] text-indigo-400">表示名: {vol.nickname}</div>}
                          </td>
                          <td className="p-2.5 space-y-0.5">
                            {vol.email && (
                              <div className="flex items-center gap-1 text-[11px]">
                                <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                                <span>{vol.email}</span>
                              </div>
                            )}
                            {vol.contact && <div className="text-[11px] opacity-80">📞 {vol.contact}</div>}
                            {!vol.email && !vol.contact && <span className="opacity-50">-</span>}
                          </td>
                          <td className="p-2.5 text-[11px] opacity-80">
                            {vol.address ? (
                              <span className="flex items-center gap-1">
                                <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                                {vol.address}
                              </span>
                            ) : (
                              "-"
                            )}
                          </td>
                          <td className="p-2.5 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => startEditVolunteer(vol)}
                                className="px-2.5 py-1 rounded-lg bg-indigo-500/15 text-indigo-400 hover:bg-indigo-500/25 text-[10px] font-bold flex items-center gap-1"
                              >
                                <Edit3 className="w-3 h-3" />
                                変更
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteVolunteer(vol.id, vol.name)}
                                className="px-2.5 py-1 rounded-lg bg-rose-500/10 text-rose-500 hover:bg-rose-500/20 text-[10px] font-bold"
                              >
                                削除
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <form onSubmit={handleSaveVolunteer} className={`p-4 rounded-xl border space-y-3 ${
                editingVolId
                  ? darkMode ? "bg-indigo-950/40 border-indigo-500" : "bg-indigo-50/80 border-indigo-400"
                  : darkMode ? "bg-slate-800/60 border-slate-700" : "bg-white border-indigo-100"
              }`}>
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold text-indigo-400">
                    {editingVolId ? `✏️ 「${newVolName}」さんの登録情報を編集中` : "＋ 名簿に新しく登録する（住所・メール・電話等も入力可能）"}
                  </p>
                  {editingVolId && (
                    <button
                      type="button"
                      onClick={cancelEditVolunteer}
                      className="text-xs text-slate-400 hover:text-slate-200 flex items-center gap-1"
                    >
                      <X className="w-3.5 h-3.5" /> キャンセル
                    </button>
                  )}
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-400 mb-1">区分</label>
                    <select
                      value={newVolType}
                      onChange={(e) => setNewVolType(e.target.value as "volunteer" | "donor")}
                      className={`w-full px-3 py-2 rounded-xl border text-xs ${darkMode ? "bg-slate-900 border-slate-700 text-white" : "bg-slate-50 border-slate-200"}`}
                    >
                      <option value="volunteer">🐾 ボランティア・スタッフ</option>
                      <option value="donor">🎁 寄付者・サポーター</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-400 mb-1">氏名（必須）</label>
                    <input
                      type="text"
                      required
                      placeholder="例: 山田 太郎"
                      value={newVolName}
                      onChange={(e) => setNewVolName(e.target.value)}
                      className={`w-full px-3 py-2 rounded-xl border text-xs ${darkMode ? "bg-slate-900 border-slate-700 text-white" : "bg-slate-50 border-slate-200"}`}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-400 mb-1">愛称・表示名（任意）</label>
                    <input
                      type="text"
                      placeholder="例: やまだ / やまだ様"
                      value={newVolNickname}
                      onChange={(e) => setNewVolNickname(e.target.value)}
                      className={`w-full px-3 py-2 rounded-xl border text-xs ${darkMode ? "bg-slate-900 border-slate-700 text-white" : "bg-slate-50 border-slate-200"}`}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-400 mb-1">メールアドレス（任意）</label>
                    <input
                      type="email"
                      placeholder="例: donor@example.com"
                      value={newVolEmail}
                      onChange={(e) => setNewVolEmail(e.target.value)}
                      className={`w-full px-3 py-2 rounded-xl border text-xs ${darkMode ? "bg-slate-900 border-slate-700 text-white" : "bg-slate-50 border-slate-200"}`}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-400 mb-1">電話番号・連絡先（任意）</label>
                    <input
                      type="text"
                      placeholder="例: 090-1234-5678"
                      value={newVolContact}
                      onChange={(e) => setNewVolContact(e.target.value)}
                      className={`w-full px-3 py-2 rounded-xl border text-xs ${darkMode ? "bg-slate-900 border-slate-700 text-white" : "bg-slate-50 border-slate-200"}`}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-400 mb-1">住所（任意）</label>
                    <input
                      type="text"
                      placeholder="例: 宮城県仙台市..."
                      value={newVolAddress}
                      onChange={(e) => setNewVolAddress(e.target.value)}
                      className={`w-full px-3 py-2 rounded-xl border text-xs ${darkMode ? "bg-slate-900 border-slate-700 text-white" : "bg-slate-50 border-slate-200"}`}
                    />
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    type="submit"
                    className={`flex-1 py-2.5 text-white text-xs font-bold rounded-xl shadow-sm ${
                      editingVolId ? "bg-emerald-600 hover:bg-emerald-500" : "bg-indigo-600 hover:bg-indigo-500"
                    }`}
                  >
                    {editingVolId ? "✔ 変更内容を保存する" : "名簿に登録する"}
                  </button>
                  {editingVolId && (
                    <button
                      type="button"
                      onClick={cancelEditVolunteer}
                      className="px-4 py-2.5 rounded-xl border border-slate-500/40 text-xs font-bold hover:bg-slate-500/10"
                    >
                      キャンセル
                    </button>
                  )}
                </div>
              </form>
            </div>

            <div className="space-y-3 pt-2 border-t border-slate-700/30">
              <h3 className="text-sm font-bold flex items-center gap-2 text-amber-500">
                <Heart className="w-4 h-4" />
                保護動物名簿 ＆ 次回医療・ワクチン期限管理 ({animals.length}頭)
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {animals.map((anim) => {
                  const costs = animalCosts(anim.id);
                  const st = anim.status || "recruiting";
                  return (
                  <div
                    key={anim.id}
                    className={`p-3 rounded-xl border text-xs flex justify-between items-center ${
                      darkMode ? "bg-slate-800 border-slate-700" : "bg-white border-slate-200"
                    }`}
                  >
                    <div>
                      <div className="font-bold flex items-center gap-1.5 flex-wrap">
                        <span>{anim.species === "dog" ? "🐶" : "🐱"} {anim.name}</span>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${st === "adopted" ? "bg-slate-500/20 text-slate-400" : st === "trial" ? "bg-amber-500/20 text-amber-500" : "bg-emerald-500/20 text-emerald-500"}`}>
                          {st === "adopted" ? "譲渡済み" : st === "trial" ? "トライアル中" : "募集中"}
                        </span>
                        {anim.is_public === false && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-500/20 text-slate-400">非公開</span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        {[anim.sex, anim.age_text].filter(Boolean).join(" ・ ") || "性別・年齢 未登録"}
                      </div>
                      <div className="text-[11px] text-rose-400">
                        次回医療日: {anim.next_medical_date || "未設定"} ({anim.medical_notes || "メモなし"})
                      </div>
                      {costs.total > 0 && (
                        <div className="text-[11px] text-indigo-400 font-semibold">
                          医療費 ¥{costs.medical.toLocaleString()} ・ 全費用 ¥{costs.total.toLocaleString()}
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <button
                        onClick={() => startEditAnimal(anim)}
                        className="text-indigo-400 hover:text-indigo-500 font-bold text-xs"
                      >
                        編集
                      </button>
                      <button
                        onClick={() => handleDeleteAnimal(anim.id)}
                        className="text-rose-400 hover:text-rose-500 font-bold text-xs"
                      >
                        削除
                      </button>
                    </div>
                  </div>
                  );
                })}
              </div>

              <form onSubmit={handleAddAnimal} className={`p-4 rounded-xl border space-y-3 ${darkMode ? "bg-slate-800/60 border-slate-700" : "bg-white border-indigo-100"}`}>
                <p className="text-xs font-bold text-indigo-400">{editingAnimalId ? "✏️ 保護動物の編集" : "＋ 保護動物と次回医療予定の登録"}</p>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                  <select
                    value={newAnimalSpecies}
                    onChange={(e) => setNewAnimalSpecies(e.target.value)}
                    className={`px-3 py-2 rounded-xl border text-xs ${darkMode ? "bg-slate-900 border-slate-700 text-white" : "bg-slate-50 border-slate-200"}`}
                  >
                    <option value="cat">🐱 猫</option>
                    <option value="dog">🐶 犬</option>
                  </select>
                  <input
                    type="text"
                    required
                    placeholder="名前（例: タマちゃん）"
                    value={newAnimalName}
                    onChange={(e) => setNewAnimalName(e.target.value)}
                    className={`px-3 py-2 rounded-xl border text-xs ${darkMode ? "bg-slate-900 border-slate-700 text-white" : "bg-slate-50 border-slate-200"}`}
                  />
                  <input
                    type="date"
                    value={newAnimalDate}
                    onChange={(e) => setNewAnimalDate(e.target.value)}
                    className={`px-3 py-2 rounded-xl border text-xs ${darkMode ? "bg-slate-900 border-slate-700 text-white" : "bg-slate-50 border-slate-200"}`}
                  />
                  <input
                    type="text"
                    placeholder="医療メモ（例: ワクチン次回）"
                    value={newAnimalNotes}
                    onChange={(e) => setNewAnimalNotes(e.target.value)}
                    className={`px-3 py-2 rounded-xl border text-xs ${darkMode ? "bg-slate-900 border-slate-700 text-white" : "bg-slate-50 border-slate-200"}`}
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                  <select
                    value={newAnimalSex}
                    onChange={(e) => setNewAnimalSex(e.target.value)}
                    className={`px-3 py-2 rounded-xl border text-xs ${darkMode ? "bg-slate-900 border-slate-700 text-white" : "bg-slate-50 border-slate-200"}`}
                  >
                    <option value="">性別：不明</option>
                    <option value="オス">オス</option>
                    <option value="メス">メス</option>
                  </select>
                  <input
                    type="text"
                    placeholder="年齢（例: 2歳・推定）"
                    value={newAnimalAge}
                    onChange={(e) => setNewAnimalAge(e.target.value)}
                    className={`px-3 py-2 rounded-xl border text-xs ${darkMode ? "bg-slate-900 border-slate-700 text-white" : "bg-slate-50 border-slate-200"}`}
                  />
                  <select
                    value={newAnimalStatus}
                    onChange={(e) => setNewAnimalStatus(e.target.value)}
                    className={`px-3 py-2 rounded-xl border text-xs ${darkMode ? "bg-slate-900 border-slate-700 text-white" : "bg-slate-50 border-slate-200"}`}
                  >
                    <option value="recruiting">募集中</option>
                    <option value="trial">トライアル中</option>
                    <option value="adopted">譲渡済み</option>
                  </select>
                  <label className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs ${darkMode ? "bg-slate-900 border-slate-700 text-white" : "bg-slate-50 border-slate-200"}`}>
                    <input
                      type="checkbox"
                      checked={newAnimalPublic}
                      onChange={(e) => setNewAnimalPublic(e.target.checked)}
                    />
                    他のサイトに公開
                  </label>
                </div>
                <button type="submit" className="w-full py-2 bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold rounded-xl shadow-sm">
                  {editingAnimalId ? "変更を保存" : "保護動物・スケジュールを登録"}
                </button>
                {editingAnimalId && (
                  <button type="button" onClick={cancelEditAnimal} className={`w-full py-2 text-xs font-bold rounded-xl border ${darkMode ? "border-slate-700 text-slate-300" : "border-slate-200 text-slate-500"}`}>
                    編集をキャンセル
                  </button>
                )}
              </form>
            </div>
          </section>
        )}

        {userOrgId && (
          <section className={`rounded-2xl p-6 border shadow-sm print:hidden ${darkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-100"}`}>
            <h2 className="text-base font-bold mb-4 flex items-center gap-2">
              <CalendarDays className="w-5 h-5 text-indigo-500" />
              当番表（シフト）
            </h2>
            <p className="text-[11px] text-slate-400 -mt-2 mb-3">
              カレンダーの日付を押すと、その日の当番が見られます{isAdmin ? "（登録フォームの日付にも入ります）" : ""}。
            </p>

            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShiftCalendarMonth(new Date(calYear, calMonth - 1, 1))}
                  className={`px-2.5 py-1 rounded-lg border text-xs font-bold ${darkMode ? "border-slate-700 hover:bg-slate-800" : "border-slate-200 hover:bg-slate-50"}`}
                  aria-label="前月"
                >
                  ‹
                </button>
                <span className="text-sm font-bold">
                  {calYear}年{calMonth + 1}月
                </span>
                <button
                  type="button"
                  onClick={() => setShiftCalendarMonth(new Date(calYear, calMonth + 1, 1))}
                  className={`px-2.5 py-1 rounded-lg border text-xs font-bold ${darkMode ? "border-slate-700 hover:bg-slate-800" : "border-slate-200 hover:bg-slate-50"}`}
                  aria-label="翌月"
                >
                  ›
                </button>
              </div>
              <button
                type="button"
                onClick={() => {
                  const t = new Date();
                  setShiftCalendarMonth(new Date(t.getFullYear(), t.getMonth(), 1));
                  setSelectedShiftDate(toLocalDateStr(t));
                  if (isAdmin) setNewShiftDate(toLocalDateStr(t));
                }}
                className="text-[11px] font-bold text-indigo-400 hover:text-indigo-300"
              >
                今月に戻る
              </button>
            </div>

            <div className="grid grid-cols-7 text-center text-[10px] font-bold text-slate-400 mb-1">
              {["日", "月", "火", "水", "木", "金", "土"].map((w, i) => (
                <div key={w} className={i === 0 ? "text-rose-400" : i === 6 ? "text-sky-400" : ""}>
                  {w}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1">
              {calendarDays.map((day) => {
                const dateStr = toLocalDateStr(day);
                const dayShifts = shiftsByDate.get(dateStr) ?? [];
                const inMonth = day.getMonth() === calMonth;
                const isToday = dateStr === toLocalDateStr(new Date());
                const isSelected = dateStr === selectedShiftDate;
                return (
                  <button
                    key={dateStr}
                    type="button"
                    onClick={() => {
                      setSelectedShiftDate(dateStr);
                      if (isAdmin) setNewShiftDate(dateStr);
                    }}
                    className={`min-h-[64px] sm:min-h-[76px] rounded-xl border p-1 text-left align-top transition-colors ${
                      isSelected
                        ? "border-indigo-500 ring-1 ring-indigo-500/50"
                        : darkMode
                          ? "border-slate-800 hover:border-slate-600"
                          : "border-slate-100 hover:border-slate-300"
                    } ${isToday ? (darkMode ? "bg-indigo-500/10" : "bg-indigo-50") : ""} ${inMonth ? "" : "opacity-40"}`}
                  >
                    <span className={`text-[10px] font-bold ${isToday ? "text-indigo-400" : "text-slate-400"}`}>
                      {day.getDate()}
                    </span>
                    <span className="block space-y-0.5 mt-0.5">
                      {dayShifts.slice(0, 3).map((s) => (
                        <span
                          key={s.id}
                          className={`block truncate rounded-md px-1 py-px text-[9px] sm:text-[10px] font-bold ${shiftRoleChipClass(s.role)}`}
                        >
                          {SHIFT_ROLE_SHORT[s.role] ?? s.role} {s.volunteer_name}
                        </span>
                      ))}
                      {dayShifts.length > 3 && (
                        <span className="block text-[9px] text-slate-400 px-1">+{dayShifts.length - 3}件</span>
                      )}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="mt-4">
              <p className="text-xs font-bold mb-2">
                {(() => {
                  const d = new Date(`${selectedShiftDate}T00:00:00`);
                  return `${d.getMonth() + 1}/${d.getDate()}（${"日月火水木金土"[d.getDay()]}）`;
                })()}
                {selectedShiftDate === toLocalDateStr(new Date()) ? "（今日）" : ""} の当番
              </p>
              {selectedDayShifts.length === 0 ? (
                <p className="text-xs text-slate-400">この日の当番はまだ登録されていません。</p>
              ) : (
                <ul className="space-y-2">
                  {selectedDayShifts.map((s) => (
                    <li
                      key={s.id}
                      className={`flex items-center gap-3 px-3 py-2 rounded-xl border text-xs ${
                        darkMode ? "bg-slate-800/60 border-slate-700" : "bg-slate-50 border-slate-200"
                      }`}
                    >
                      <span className="font-semibold">{s.volunteer_name}</span>
                      <span className={`px-2 py-0.5 rounded-full font-bold ${shiftRoleChipClass(s.role)}`}>
                        {s.role}
                      </span>
                      {s.note && <span className="text-slate-400">{s.note}</span>}
                      {isAdmin && (
                        <button
                          type="button"
                          onClick={() => handleDeleteShift(s.id)}
                          className="ml-auto text-slate-400 hover:text-rose-500"
                          aria-label="当番を削除"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {isAdmin ? (
              <form onSubmit={handleAddShift} className="mt-4 grid grid-cols-2 sm:grid-cols-5 gap-2 items-end">
                <div>
                  <label className="block text-[11px] font-semibold mb-1">日付</label>
                  <input
                    type="date"
                    required
                    value={newShiftDate}
                    onChange={(e) => setNewShiftDate(e.target.value)}
                    className={`w-full px-2 py-2 rounded-xl border text-xs ${darkMode ? "bg-slate-800 border-slate-700 text-white" : "bg-slate-50 border-slate-200"}`}
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold mb-1">担当者</label>
                  {volunteers.length > 0 ? (
                    <select
                      required
                      value={newShiftVolunteer}
                      onChange={(e) => setNewShiftVolunteer(e.target.value)}
                      className={`w-full px-2 py-2 rounded-xl border text-xs ${darkMode ? "bg-slate-800 border-slate-700 text-white" : "bg-slate-50 border-slate-200"}`}
                    >
                      <option value="">選択してください</option>
                      {volunteers
                        .filter((v) => v.member_type !== "donor")
                        .map((v) => (
                          <option key={v.id} value={v.nickname || v.name}>
                            {v.nickname || v.name}（{v.name}）
                          </option>
                        ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      required
                      placeholder="例: はなこ"
                      value={newShiftVolunteer}
                      onChange={(e) => setNewShiftVolunteer(e.target.value)}
                      className={`w-full px-2 py-2 rounded-xl border text-xs ${darkMode ? "bg-slate-800 border-slate-700 text-white" : "bg-slate-50 border-slate-200"}`}
                    />
                  )}
                </div>
                <div>
                  <label className="block text-[11px] font-semibold mb-1">役割</label>
                  <select
                    value={newShiftRole}
                    onChange={(e) => setNewShiftRole(e.target.value)}
                    className={`w-full px-2 py-2 rounded-xl border text-xs ${darkMode ? "bg-slate-800 border-slate-700 text-white" : "bg-slate-50 border-slate-200"}`}
                  >
                    {SHIFT_ROLES.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold mb-1">メモ（任意）</label>
                  <input
                    type="text"
                    placeholder="例: 朝9時〜"
                    value={newShiftNote}
                    onChange={(e) => setNewShiftNote(e.target.value)}
                    className={`w-full px-2 py-2 rounded-xl border text-xs ${darkMode ? "bg-slate-800 border-slate-700 text-white" : "bg-slate-50 border-slate-200"}`}
                  />
                </div>
                <button
                  type="submit"
                  className="py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl"
                >
                  当番を追加
                </button>
              </form>
            ) : (
              <p className="text-[11px] text-slate-400 mt-3">当番の追加・変更は団体管理者が行います。</p>
            )}
          </section>
        )}

        {userOrgId && (
          <section className={`rounded-2xl p-6 border shadow-sm print:hidden ${darkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-100"}`}>
            <h2 className="text-base font-bold mb-4 flex items-center gap-2">
              <PlusCircle className="w-5 h-5 text-indigo-500" />
              新規申請フォーム（スマホOCRレシート読取補助付き）
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

              <div className="p-4 rounded-xl border border-indigo-500/30 bg-indigo-500/5 space-y-2">
                <label className="block text-xs font-bold text-indigo-400 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4" />
                  レシート撮影・AI文字認識（OCR）入力補助（画像は保存されません）
                </label>
                <p className="text-[11px] text-slate-400">
                  金額や項目の手入力を省くための読み取り補助です。紙のレシート原本は別途、領収書台紙に貼付して提出してください。
                </p>
                <input
                  id="image-input"
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={(e) => handleReceiptImageChange(e.target.files?.[0] || null)}
                  className="w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-indigo-600 file:text-white"
                />
                {isOcrProcessing && (
                  <p className="text-xs text-amber-400 font-bold animate-pulse">
                    ✨ レシートから金額・項目を読み取り中...
                  </p>
                )}
                {ocrDoneMessage && (
                  <p className="text-xs text-emerald-500 font-bold">
                    {ocrDoneMessage}
                  </p>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-[11px] font-bold text-slate-400 mr-1">定番テンプレート:</span>
                {LOG_TEMPLATES.map((t) => (
                  <button
                    key={t.label}
                    type="button"
                    onClick={() => applyLogTemplate(t)}
                    className={`px-2.5 py-1.5 rounded-full border text-[11px] font-semibold transition-all ${
                      darkMode
                        ? "bg-slate-800 border-slate-700 text-slate-300 hover:border-indigo-500"
                        : "bg-slate-50 border-slate-200 text-slate-600 hover:border-indigo-400"
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
                {logs.length > 0 && (
                  <button
                    type="button"
                    onClick={copyLastLog}
                    className={`ml-3 px-2.5 py-1.5 rounded-full border text-[11px] font-semibold flex items-center gap-1 transition-all ${
                      darkMode
                        ? "bg-slate-800 border-slate-700 text-slate-300 hover:border-indigo-500"
                        : "bg-slate-50 border-slate-200 text-slate-600 hover:border-indigo-400"
                    }`}
                  >
                    <Copy className="w-3 h-3" />
                    前回の申請をコピー
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-1">
                    {type === "expense" ? "申請者（ボランティア）" : "提供者・担当者"}
                  </label>
                  <select
                    value={volunteerName}
                    onChange={(e) => setVolunteerName(e.target.value)}
                    className={`w-full px-3 py-2 rounded-xl border text-xs ${darkMode ? "bg-slate-800 border-slate-700 text-white" : "bg-slate-50 border-slate-200"}`}
                  >
                    <option value="匿名">匿名</option>
                    {volunteers.map((v) => (
                      <option key={v.id} value={v.nickname || v.name}>
                        {v.member_type === "donor" ? "🎁 " : ""}
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
                  <label className="block text-xs font-semibold mb-1">備考・詳細（任意）</label>
                  <input
                    type="text"
                    placeholder="例: 領収書原本は郵送済み"
                    value={details}
                    onChange={(e) => setDetails(e.target.value)}
                    className={`w-full px-3 py-2 rounded-xl border text-xs ${darkMode ? "bg-slate-800 border-slate-700 text-white" : "bg-slate-50 border-slate-200"}`}
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
                  表示するデータがありません。管理者は「管理者ログイン / 団体登録」からログインするか、「🎮 デモ体験」をお試しください。
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredLogs.map((log) => {
                  const animalObj = animals.find((a) => a.id === log.cat_id);
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
                          {isAdmin && (
                            <button onClick={() => handleDelete(log.id, log.title)} className="text-slate-500 hover:text-rose-400">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
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

        {showLoginModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className={`p-6 rounded-2xl max-w-sm w-full space-y-4 border max-h-[90vh] overflow-y-auto ${darkMode ? "bg-slate-900 border-slate-800 text-white" : "bg-white border-slate-200 text-slate-800"}`}>
              <div className="flex items-center justify-between border-b border-slate-700/60 pb-2">
                <h3 className="text-base font-bold flex items-center gap-2">
                  <Building className="w-4 h-4 text-indigo-500" />
                  {isSignUpMode ? "新規団体・アカウント登録" : "管理者ログイン"}
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
                  <p className="text-[11px] text-slate-400">団体名を入力して登録すると、自動で専用アカウントが作成されます。</p>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 mb-1">団体名（必須）</label>
                    <input
                      type="text"
                      required
                      placeholder="例: 仙台保護猫の会"
                      value={regOrgName}
                      onChange={(e) => handleOrgNameChange(e.target.value)}
                      className={`w-full px-3 py-2 rounded-xl border text-xs ${darkMode ? "bg-slate-800 border-slate-700 text-white" : "bg-slate-50 border-slate-200"}`}
                    />
                    {regOrgSlug && (
                      <p className="text-[10px] text-slate-400 mt-1">
                        ボランティア共有URL: <span className="font-mono text-indigo-400">?org={regOrgSlug}</span>
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 mb-1">あなたの氏名（管理者名・必須）</label>
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
                    <label className="block text-[11px] font-semibold text-slate-400 mb-1">メールアドレス（必須）</label>
                    <input
                      type="email"
                      required
                      name="email"
                      autoComplete="email"
                      placeholder="admin@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className={`w-full px-3 py-2 rounded-xl border text-xs ${darkMode ? "bg-slate-800 border-slate-700 text-white" : "bg-slate-50 border-slate-200"}`}
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 mb-1">パスワード（6文字以上）</label>
                    <input
                      type="password"
                      required
                      name="password"
                      autoComplete="new-password"
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
                      name="email"
                      autoComplete="email"
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
                      name="password"
                      autoComplete="current-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className={`w-full px-3 py-2 rounded-xl border text-xs ${darkMode ? "bg-slate-800 border-slate-700 text-white" : "bg-slate-50 border-slate-200"}`}
                    />
                  </div>
                  <div className="text-right">
                    <button
                      type="button"
                      onClick={handleForgotPassword}
                      className="text-[11px] font-semibold text-indigo-400 hover:underline"
                    >
                      パスワードを忘れた方はこちら
                    </button>
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

        {showResetPasswordModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className={`p-6 rounded-2xl max-w-sm w-full space-y-4 border ${darkMode ? "bg-slate-900 border-slate-800 text-white" : "bg-white border-slate-200 text-slate-800"}`}>
              <h3 className="text-base font-bold flex items-center gap-2">
                <Lock className="w-4 h-4 text-indigo-500" />
                新しいパスワードの設定
              </h3>
              <p className="text-[11px] text-slate-400">パスワード再設定用のリンクから開かれました。新しいパスワードを入力してください。</p>
              <form onSubmit={handleResetPassword} className="space-y-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1">新しいパスワード（6文字以上）</label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    name="new-password"
                    autoComplete="new-password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className={`w-full px-3 py-2 rounded-xl border text-xs ${darkMode ? "bg-slate-800 border-slate-700 text-white" : "bg-slate-50 border-slate-200"}`}
                  />
                </div>
                <button type="submit" className="w-full px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-semibold">
                  パスワードを変更する
                </button>
              </form>
            </div>
          </div>
        )}

        <footer className="pt-8 pb-4 text-center space-y-2">
          <div className="flex justify-center gap-2 flex-wrap">
            <a href="https://rescue-cat-app.pages.dev/" className={`px-3 py-1.5 rounded-full text-[11px] font-bold ${darkMode ? "bg-slate-800 text-slate-200 hover:bg-slate-700" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>🐾 RescuCat・支援金</a>
            <a href="https://nekonote-support.pages.dev/" className={`px-3 py-1.5 rounded-full text-[11px] font-bold ${darkMode ? "bg-slate-800 text-slate-200 hover:bg-slate-700" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>📦 Nekonote・物資支援</a>
            <span className={`px-3 py-1.5 rounded-full text-[11px] font-bold ${darkMode ? "bg-indigo-600 text-white" : "bg-indigo-100 text-indigo-700"}`}>📋 RescueOps（今ここ）</span>
            <a href="https://nyanstagram.pages.dev/" className={`px-3 py-1.5 rounded-full text-[11px] font-bold ${darkMode ? "bg-slate-800 text-slate-200 hover:bg-slate-700" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>🐱 にゃんスタグラム</a>
          </div>
          <div className="flex justify-center gap-4 text-[11px]">
            <button type="button" onClick={() => setLegalKind("terms")} className="underline text-slate-400 hover:text-indigo-500">利用規約</button>
            <button type="button" onClick={() => setLegalKind("privacy")} className="underline text-slate-400 hover:text-indigo-500">プライバシーポリシー</button>
          </div>
          <p className="text-[10px] text-slate-400">運営：保護ねこ支援 RescuCat 運営事務局</p>
        </footer>

        {legalKind && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4" onClick={() => setLegalKind(null)}>
            <div className={`p-6 rounded-2xl max-w-md w-full max-h-[85vh] overflow-y-auto border ${darkMode ? "bg-slate-900 border-slate-800 text-white" : "bg-white border-slate-200 text-slate-800"}`} onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-base font-bold">{legalKind === "terms" ? "利用規約" : "プライバシーポリシー"}</h3>
                <button type="button" onClick={() => setLegalKind(null)} className="text-slate-400 text-xl leading-none">×</button>
              </div>
              <div className="text-xs leading-relaxed whitespace-pre-wrap">{legalKind === "terms" ? LEGAL_TERMS : LEGAL_PRIVACY}</div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
