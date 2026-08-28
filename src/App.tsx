import React, { useState, useEffect } from 'react';
import { 
  Download, UserPlus, Play, Star, ShieldCheck, 
  Smartphone, Wallet, ArrowLeft, RefreshCw, 
  CheckCircle, MessageCircle, Clock, Trophy, ChevronRight, X 
} from 'lucide-react';

const API_BASE_URLS = ['https://matka-r6mz.onrender.com', 'http://localhost:5001'];

const fetchApi = async (endpoint: string, options: any = {}) => {
  for (const base of API_BASE_URLS) {
    try {
      const res = await fetch(`${base}${endpoint}`, options);
      if (res.ok) return res;
    } catch (e) {}
  }
  return fetch(`${API_BASE_URLS[0]}${endpoint}`, options);
};

interface GameSchedule {
  name: string;
  open: string;
  close: string;
  result: string;
}

const DEFAULT_SCHEDULES: Record<string, GameSchedule> = {
  "Desawar": { name: "Desawar", open: "05:00 AM IST", close: "04:00 AM IST", result: "06:00 AM IST" },
  "Shiv Parwati": { name: "Shiv Parwati", open: "04:00 AM IST", close: "12:00 PM IST", result: "12:40 PM IST" },
  "Delhi Bazar": { name: "Delhi Bazar", open: "04:00 AM IST", close: "02:45 PM IST", result: "03:20 PM IST" },
  "Dubai Market": { name: "Dubai Market", open: "04:00 AM IST", close: "04:00 PM IST", result: "04:00 PM IST" },
  "Shree Ganesh": { name: "Shree Ganesh", open: "04:00 AM IST", close: "04:30 PM IST", result: "04:50 PM IST" },
  "Faridabad": { name: "Faridabad", open: "04:00 AM IST", close: "05:40 PM IST", result: "06:20 PM IST" },
  "Ghaziabad": { name: "Ghaziabad", open: "04:00 AM IST", close: "09:30 PM IST", result: "10:10 PM IST" },
  "Gali": { name: "Gali", open: "04:00 AM IST", close: "11:30 PM IST", result: "11:59 PM IST" }
};

export default function App() {
  // Navigation View: 'landing' | 'auth' | 'webapp'
  const [view, setView] = useState<'landing' | 'auth' | 'webapp'>('landing');

  // Auth Flow States: 'phone' | 'otp' | 'register'
  const [authStep, setAuthStep] = useState<'phone' | 'otp' | 'register'>('phone');
  const [mobileNumber, setMobileNumber] = useState('');
  const [otpInput, setOtpInput] = useState('');
  const [registerName, setRegisterName] = useState('');
  const [registerPassword, setRegisterPassword] = useState('123456');
  const [referralCodeInput, setReferralCodeInput] = useState('');
  const [isExistingUser, setIsExistingUser] = useState(false);
  const [existingUserData, setExistingUserData] = useState<{ name: string; mobile: string; balance: number; referral_code?: string; referralsCount?: number } | null>(null);
  const [authError, setAuthError] = useState('');

  // Player User Session
  const [user, setUser] = useState<{ name: string; mobile: string; balance: number; referral_code?: string; referralsCount?: number } | null>(null);

  // App Data States
  const [declaredResults, setDeclaredResults] = useState<Record<string, number>>({});
  const [bannerConfig, setBannerConfig] = useState<any>(null);

  // WebApp Modal & Bidding States
  const [isSideMenuOpen, setIsSideMenuOpen] = useState(false);
  const [selectedGameForBetting, setSelectedGameForBetting] = useState<string | null>(null);
  const [betCategory, setBetCategory] = useState<'Jodi' | 'Crossing' | 'Haruf'>('Jodi');
  const [harufSubTab, setHarufSubTab] = useState<'Ander' | 'Bahar'>('Ander');
  const [jodiGrid, setJodiGrid] = useState<Record<string, string>>({});
  const [crossingDigits, setCrossingDigits] = useState('');
  const [crossingAmount, setCrossingAmount] = useState('10');
  const [betMessage, setBetMessage] = useState('');
  const [chartFilter, setChartFilter] = useState<'today' | 'yesterday' | 'custom'>('today');
  const [selectedChartDate, setSelectedChartDate] = useState(new Date().toISOString().split('T')[0]);
  const [dateChartResults, setDateChartResults] = useState<Record<string, string>>({});
  const [showRulesModal, setShowRulesModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showReferralModal, setShowReferralModal] = useState(false);
  const [copiedToast, setCopiedToast] = useState(false);

  // Referral Details State
  const [referralDetails, setReferralDetails] = useState<{
    referral_code: string;
    referralsCount: number;
    totalCommission: number;
    referredUsers: Array<{
      id: string;
      name: string;
      mobile: string;
      date: string;
      bonus: number;
      betCommission: number;
      totalEarned: number;
    }>;
  }>({
    referral_code: '',
    referralsCount: 0,
    totalCommission: 0,
    referredUsers: []
  });

  const fetchWebsiteReferralDetails = async () => {
    const saved = localStorage.getItem('95x_web_user');
    const mob = user?.mobile || (saved ? JSON.parse(saved)?.mobile : null);
    if (!mob) return;
    const cleanMobile = mob.replace(/[^0-9]/g, '').slice(-10);
    try {
      const res = await fetchApi(`/api/user/referral-details?mobile=${cleanMobile}`);
      if (res.ok) {
        const data = await res.json();
        setReferralDetails({
          referral_code: data.referral_code || `REF${cleanMobile}`,
          referralsCount: data.referralsCount !== undefined ? data.referralsCount : 0,
          totalCommission: data.totalCommission !== undefined ? data.totalCommission : 0,
          referredUsers: data.referredUsers || []
        });
      }
    } catch (e) {}
  };

  const [applyRefInput, setApplyRefInput] = useState('');
  const [applyRefStatus, setApplyRefStatus] = useState('');

  const handleApplyReferralCode = async () => {
    if (!applyRefInput.trim()) {
      setApplyRefStatus('Please enter a referral code');
      return;
    }
    setApplyRefStatus('Applying...');
    const saved = localStorage.getItem('95x_web_user');
    const mob = user?.mobile || (saved ? JSON.parse(saved)?.mobile : null);
    if (!mob) {
      setApplyRefStatus('Please log in first');
      return;
    }

    try {
      const res = await fetchApi('/api/user/apply-referral', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mobile: mob,
          referral_code: applyRefInput.trim()
        })
      });
      const data = await res.json();
      if (data.success) {
        setApplyRefStatus(data.message);
        setApplyRefInput('');
        fetchWebsiteReferralDetails();
      } else {
        setApplyRefStatus(data.message || 'Failed to apply referral code');
      }
    } catch (e) {
      setApplyRefStatus('Server error while applying code');
    }
  };

  useEffect(() => {
    fetchWebsiteReferralDetails();
  }, [showReferralModal, user?.mobile]);

  const formatChartDateDisplay = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
    } catch (e) {
      return dateStr;
    }
  };

  const isGameBettingOpen = (gameName: string, sched: GameSchedule) => {
    const result = declaredResults[gameName] ?? declaredResults[gameName === 'Desawar' ? 'Disawer' : (gameName === 'Shree Ganesh' ? 'Shri Ganesh' : gameName)];
    if (result !== undefined && result !== null) return false;

    try {
      const now = new Date();
      const istTime = new Date(now.getTime() + (5.5 * 60 * 60 * 1000));
      const currentMins = istTime.getUTCHours() * 60 + istTime.getUTCMinutes();

      const cleanClose = sched.close.replace('IST', '').trim();
      const parts = cleanClose.split(' ');
      const timeParts = parts[0].split(':');
      let h = parseInt(timeParts[0]);
      const m = parseInt(timeParts[1]);
      const ampm = parts[1];

      if (ampm === 'PM' && h < 12) h += 12;
      if (ampm === 'AM' && h === 12) h = 0;

      const closeMins = h * 60 + m;

      if (gameName === 'Desawar') {
        if (currentMins >= 4 * 60 && currentMins < 5 * 60) return false;
        return true;
      }

      return currentMins < closeMins;
    } catch (e) {
      return true;
    }
  };

  // Fetch Date-wise Chart Results from Backend & DB
  useEffect(() => {
    const fetchDateChart = async () => {
      let targetDate = new Date().toISOString().split('T')[0];
      if (chartFilter === 'yesterday') {
        const y = new Date();
        y.setDate(y.getDate() - 1);
        targetDate = y.toISOString().split('T')[0];
      } else if (chartFilter === 'custom') {
        targetDate = selectedChartDate;
      }

      try {
        const res = await fetchApi(`/api/game/chart-results?date=${targetDate}`);
        if (res.ok) {
          const data = await res.json();
          setDateChartResults(data.results || {});
        }
      } catch (e) {}
    };

    fetchDateChart();
  }, [chartFilter, selectedChartDate]);

  const [showDepositModal, setShowDepositModal] = useState(false);
  const [depositAmount, setDepositAmount] = useState('500');
  const [depositUtr, setDepositUtr] = useState('');
  const [depositMessage, setDepositMessage] = useState('');

  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('500');
  const [withdrawMethod, setWithdrawMethod] = useState<'UPI' | 'Bank'>('UPI');
  const [withdrawUpi, setWithdrawUpi] = useState('');
  const [withdrawHolderName, setWithdrawHolderName] = useState('');
  const [withdrawBankAcc, setWithdrawBankAcc] = useState('');
  const [withdrawBankIfsc, setWithdrawBankIfsc] = useState('');
  const [withdrawMessage, setWithdrawMessage] = useState('');
  const [isWithdrawSubmitting, setIsWithdrawSubmitting] = useState(false);

  const handleWithdrawSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setWithdrawMessage('');
    const numAmt = parseFloat(withdrawAmount);

    if (!numAmt || numAmt < 500) {
      setWithdrawMessage('Error: Minimum withdrawal amount is ₹500');
      return;
    }

    if (user && numAmt > user.balance) {
      setWithdrawMessage(`Error: Insufficient balance. Available: ₹${user.balance.toFixed(2)}`);
      return;
    }

    const detailsStr = withdrawMethod === 'UPI' 
      ? (withdrawUpi || 'UPI ID') 
      : `Acc: ${withdrawBankAcc}, IFSC: ${withdrawBankIfsc}`;

    if (withdrawMethod === 'UPI' && !withdrawUpi.trim()) {
      setWithdrawMessage('Error: Please enter a valid UPI ID');
      return;
    }

    if (withdrawMethod === 'Bank' && (!withdrawBankAcc.trim() || !withdrawBankIfsc.trim())) {
      setWithdrawMessage('Error: Please enter Account Number and IFSC Code');
      return;
    }

    setIsWithdrawSubmitting(true);

    try {
      const res = await fetchApi('/api/user/withdraw/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user: user?.mobile,
          mobile: user?.mobile,
          amount: numAmt,
          method: withdrawMethod,
          details: detailsStr,
          holder_name: withdrawHolderName || user?.name || 'Player'
        })
      });

      const data = await res.json();
      if (data.success) {
        setWithdrawMessage(`✅ Request Submitted! ₹${numAmt} will be settled within 15 minutes.`);
        if (user) {
          const newBal = data.newBalance !== undefined ? data.newBalance : Math.max(0, user.balance - numAmt);
          const updatedUser = { ...user, balance: newBal };
          setUser(updatedUser);
          localStorage.setItem('95x_web_user', JSON.stringify(updatedUser));
        }
        setTimeout(() => {
          setShowWithdrawModal(false);
          setWithdrawMessage('');
        }, 2500);
      } else {
        setWithdrawMessage(`Error: ${data.message || 'Withdrawal failed'}`);
      }
    } catch (err) {
      if (user) {
        const updatedUser = { ...user, balance: Math.max(0, user.balance - numAmt) };
        setUser(updatedUser);
        localStorage.setItem('95x_web_user', JSON.stringify(updatedUser));
      }
      setWithdrawMessage(`✅ Withdrawal request of ₹${numAmt} submitted! Settling within 15 minutes.`);
      setTimeout(() => {
        setShowWithdrawModal(false);
        setWithdrawMessage('');
      }, 2500);
    } finally {
      setIsWithdrawSubmitting(false);
    }
  };

  const [activeWebTab, setActiveWebTab] = useState<'home' | 'mybets' | 'charts' | 'referral'>('home');
  const [myBetsList, setMyBetsList] = useState<any[]>([]);

  // Load saved session on launch & immediately sync live profile
  useEffect(() => {
    const saved = localStorage.getItem('95x_web_user');
    if (saved) {
      try {
        const u = JSON.parse(saved);
        setUser(u);
        if (u && u.mobile) {
          fetchApi(`/api/user/profile?mobile=${u.mobile}`)
            .then(res => res.ok ? res.json() : null)
            .then(data => {
              if (data) {
                const fresh = {
                  ...u,
                  name: data.name && data.name !== 'User' ? data.name : u.name,
                  balance: data.balance !== undefined ? data.balance : u.balance
                };
                setUser(fresh);
                localStorage.setItem('95x_web_user', JSON.stringify(fresh));
              }
            })
            .catch(() => {});
        }
      } catch (e) {}
    }
  }, []);

  // Poll backend data
  const refreshData = async () => {
    try {
      // Fetch Banner
      const bRes = await fetchApi('/api/game/banner');
      if (bRes.ok) {
        const bData = await bRes.json();
        setBannerConfig(bData);
      }

      // Fetch Results
      const rRes = await fetchApi('/api/game/results');
      if (rRes.ok) {
        const rData = await rRes.json();
        setDeclaredResults(rData);
      }

      // Refresh User Wallet & Profile Name from Backend live!
      const currentSaved = localStorage.getItem('95x_web_user');
      const activeMobile = user?.mobile || (currentSaved ? JSON.parse(currentSaved)?.mobile : null);
      if (activeMobile) {
        const uRes = await fetchApi(`/api/user/profile?mobile=${activeMobile}`);
        if (uRes.ok) {
          const uData = await uRes.json();
          setUser(prev => {
            const currentName = uData.name && uData.name !== 'User' ? uData.name : (prev?.name || `User ${activeMobile.slice(-4)}`);
            const currentBal = uData.balance !== undefined ? uData.balance : (prev?.balance || 0);
            const updated = { 
              name: currentName,
              mobile: activeMobile,
              balance: currentBal 
            };
            localStorage.setItem('95x_web_user', JSON.stringify(updated));
            return updated;
          });
        }

        // Fetch My Bets
        const bHistoryRes = await fetchApi(`/api/game/my-bets?mobile=${activeMobile}`);
        if (bHistoryRes.ok) {
          const bHistory = await bHistoryRes.json();
          setMyBetsList(bHistory);
        }

        // Fetch Referral Stats Live
        const cleanMob = activeMobile.replace(/[^0-9]/g, '').slice(-10);
        const refRes = await fetchApi(`/api/user/referral-details?mobile=${cleanMob}`);
        if (refRes.ok) {
          const refData = await refRes.json();
          setReferralDetails({
            referral_code: refData.referral_code || `REF${cleanMob}`,
            referralsCount: refData.referralsCount || 0,
            totalCommission: refData.totalCommission || 0,
            referredUsers: refData.referredUsers || []
          });
        }
      }
    } catch (e) {}
  };

  useEffect(() => {
    refreshData();
    const timer = setInterval(refreshData, 3000);
    return () => clearInterval(timer);
  }, [user?.mobile]);

  // Auth Handler 1: Phone Submit (Checks if number is registered)
  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanMobile = mobileNumber.replace(/[^0-9]/g, '');
    if (cleanMobile.length < 10) {
      setAuthError('Please enter valid 10-digit mobile number');
      return;
    }
    setAuthError('');
    setIsExistingUser(false);
    setExistingUserData(null);

    try {
      const res = await fetchApi(`/api/user/check?mobile=${cleanMobile}`);
      if (res.ok) {
        const data = await res.json();
        if (data && data.exists && data.user) {
          setIsExistingUser(true);
          setExistingUserData({
            name: data.user.name || `User ${cleanMobile.slice(-4)}`,
            mobile: cleanMobile,
            balance: data.user.balance || 0
          });
        }
      }
    } catch (err) {}
    setAuthStep('otp');
  };

  // Auth Handler 2: OTP Submit (Redirects to main page if registered; asks for name if new user)
  const handleOtpSubmit = async (val: string) => {
    if (val.length === 4) {
      const cleanMobile = mobileNumber.replace(/[^0-9]/g, '');

      let registeredProfile = existingUserData;

      // Double check live with backend if registered
      if (!registeredProfile) {
        try {
          const res = await fetchApi(`/api/user/check?mobile=${cleanMobile}`);
          if (res.ok) {
            const data = await res.json();
            if (data && data.exists && data.user) {
              registeredProfile = {
                name: data.user.name || `User ${cleanMobile.slice(-4)}`,
                mobile: cleanMobile,
                balance: data.user.balance || 0
              };
            }
          }
        } catch (e) {}
      }

      if (referralCodeInput.trim()) {
        try {
          await fetchApi('/api/user/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name: registeredProfile?.name || `User ${cleanMobile.slice(-4)}`,
              mobile: cleanMobile,
              password: '123',
              referral_code: referralCodeInput.trim()
            })
          });
        } catch (e) {}
      }

      if (registeredProfile || isExistingUser) {
        // ALREADY REGISTERED USER -> Redirect directly to Main WebApp Page!
        const loggedInUser = registeredProfile || {
          name: `User ${cleanMobile.slice(-4)}`,
          mobile: cleanMobile,
          balance: 0.00
        };
        setUser(loggedInUser);
        localStorage.setItem('95x_web_user', JSON.stringify(loggedInUser));
        setView('webapp');
      } else {
        // NEW USER -> Ask for Full Name!
        setAuthStep('register');
      }
    }
  };

  // Auth Handler 3: New Account Registration
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!registerName.trim()) {
      setAuthError('Please enter your full name');
      return;
    }
    const cleanMobile = mobileNumber.replace(/[^0-9]/g, '');
    const ownRef = `REF${cleanMobile}`;
    const newUser = {
      name: registerName.trim(),
      mobile: cleanMobile,
      balance: 0.00,
      referral_code: ownRef
    };

    try {
      await fetchApi('/api/user/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: registerName.trim(),
          mobile: cleanMobile,
          password: registerPassword || '123456',
          referral_code: referralCodeInput.trim()
        })
      });
    } catch (e) {}

    setUser(newUser);
    localStorage.setItem('95x_web_user', JSON.stringify(newUser));
    setView('webapp');
  };

  // Bet Submission Handler
  const handlePlaceBet = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setView('auth');
      return;
    }

    const activeBets: { num: string; amt: number; type: string }[] = [];

    if (betCategory === 'Jodi' || betCategory === 'Crossing') {
      Object.entries(jodiGrid).forEach(([num, valStr]) => {
        const val = Math.max(0, parseInt(valStr) || 0);
        if (val > 0) {
          activeBets.push({ num, amt: val, type: betCategory === 'Crossing' ? 'CROSSING' : 'JODI' });
        }
      });
    } else if (betCategory === 'Haruf') {
      Object.entries(jodiGrid).forEach(([num, valStr]) => {
        const val = Math.max(0, parseInt(valStr) || 0);
        if (val > 0) {
          activeBets.push({ num, amt: val, type: harufSubTab === 'Ander' ? 'HAROOF_ANDER' : 'HAROOF_BAHAR' });
        }
      });
    }

    const totalReq = activeBets.reduce((sum, b) => sum + b.amt, 0);

    if (activeBets.length === 0 || totalReq <= 0) {
      setBetMessage('Please enter amount on at least one number.');
      return;
    }

    if (user.balance < totalReq) {
      setBetMessage(`Insufficient wallet balance (Need ₹${totalReq})! Please add money.`);
      return;
    }

    try {
      const res = await fetchApi('/api/game/bet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          game_name: selectedGameForBetting,
          bet_type: betCategory.toUpperCase(),
          bets: activeBets.map(b => ({ number: b.num, bet_amount: b.amt })),
          mobile: user.mobile,
          userPhone: user.mobile
        })
      });

      const data = await res.json();
      if (res.ok || data.message) {
        setBetMessage('🎉 Bet placed successfully!');
        if (user) {
          const newBal = data.newBalance !== undefined ? data.newBalance : Math.max(0, user.balance - totalReq);
          const updatedUser = { ...user, balance: newBal };
          setUser(updatedUser);
          localStorage.setItem('95x_web_user', JSON.stringify(updatedUser));
        }
        setJodiGrid({});
        refreshData();
        setTimeout(() => {
          setBetMessage('');
        }, 2500);
      } else {
        setBetMessage(`Error: ${data.message || 'Bet placement failed'}`);
      }
    } catch (e) {
      setBetMessage('Bet placement failed. Please try again.');
    }
  };

  // Deposit Submission
  const handleDepositSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setDepositMessage('');
    const amtNum = parseFloat(depositAmount) || 500;
    const utrStr = depositUtr.trim() || `UTR${Date.now()}`;
    const userLabel = user ? `${user.name} (${user.mobile})` : 'kul (1122222222)';

    try {
      const res = await fetchApi('/api/user/deposit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user: userLabel,
          mobile: user?.mobile || '1122222222',
          amount: amtNum,
          method: 'UPI / PhonePe',
          utr: utrStr
        })
      });

      const data = await res.json();
      if (res.ok || data.success) {
        setDepositMessage('✅ Deposit request submitted! Admin will verify and approve shortly.');
        setTimeout(() => {
          setShowDepositModal(false);
          setDepositMessage('');
          setDepositUtr('');
        }, 2200);
      } else {
        setDepositMessage(`Error: ${data.message || 'Deposit submission failed'}`);
      }
    } catch (e) {
      setDepositMessage('Error: Failed to connect to server. Please try again.');
    }
  };

  // Download APK Trigger
  const handleDownloadApk = () => {
    const link = document.createElement('a');
    link.href = '/app-debug.apk';
    link.download = '95xmatka.apk';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-white text-gray-900 flex justify-center">
      <div className="w-full max-w-xl bg-white min-h-screen flex flex-col relative">

        {/* ========================================================= */}
        {/* VIEW 1: GOOGLE PLAY STORE STYLE LANDING PAGE              */}
        {/* ========================================================= */}
        {view === 'landing' && (
          <div className="flex-1 bg-white text-slate-900 pb-12">
            {/* Official Google Play Top Header */}
            <div className="flex justify-between items-center px-5 py-4 border-b border-gray-100 bg-white sticky top-0 z-10">
              <div className="flex items-center gap-2.5">
                <svg className="w-7 h-7 shrink-0" viewBox="0 0 24 24" fill="none">
                  <path d="M3.6 1.8C3.3 2.1 3.1 2.6 3.1 3.2V20.8C3.1 21.4 3.3 21.9 3.6 22.2L3.7 22.3L13.5 12.5V12.3V12.1L3.7 1.7L3.6 1.8Z" fill="#00C853"/>
                  <path d="M16.8 15.8L13.5 12.5V12.3V12.1L16.8 8.8L16.9 8.9L20.8 11.1C21.9 11.7 21.9 12.9 20.8 13.5L16.9 15.7L16.8 15.8Z" fill="#FFC107"/>
                  <path d="M16.9 15.7L13.5 12.3L3.6 22.2C4.0 22.6 4.7 22.7 5.5 22.2L16.9 15.7Z" fill="#FF3D00"/>
                  <path d="M16.9 8.9L5.5 2.4C4.7 1.9 4.0 2.0 3.6 2.4L13.5 12.3L16.9 8.9Z" fill="#00B0FF"/>
                </svg>
                <span className="text-xl font-medium text-[#5F6368] font-sans tracking-tight leading-none">Google Play</span>
              </div>
              <div className="flex items-center gap-5 text-gray-600">
                <button className="hover:text-gray-900"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg></button>
                <button className="hover:text-gray-900"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg></button>
              </div>
            </div>

            {/* App Card Profile */}
            <div className="p-5 flex gap-4 items-center">
              <img 
                src="/app_logo.png" 
                alt="95X MATKA" 
                className="w-20 h-20 rounded-2xl object-cover shadow-lg shrink-0" 
              />
              <div>
                <h1 className="text-2xl font-black text-gray-900 leading-none tracking-tight">95X MATKA</h1>
                <p className="text-sm font-bold text-[#00875A] mt-1">95X</p>
                <p className="text-xs text-gray-500 mt-1">Contains Ads · In-app purchases</p>
              </div>
            </div>

            {/* Stats Bar */}
            <div className="grid grid-cols-4 gap-1 px-5 py-3 border-y border-gray-100 text-center my-2">
              <div>
                <div className="flex justify-center items-center gap-1 text-sm font-bold text-gray-900">
                  <span>4.8</span> <Star className="w-3.5 h-3.5 fill-gray-900 text-gray-900" />
                </div>
                <div className="text-[10px] text-gray-500 font-medium mt-0.5">12L+</div>
              </div>
              <div className="border-l border-gray-200">
                <div className="text-sm font-bold text-gray-900">3.2MB</div>
                <div className="text-[10px] text-gray-500 font-medium mt-0.5">App Size</div>
              </div>
              <div className="border-l border-gray-200">
                <div className="text-sm font-bold text-gray-900">54L+</div>
                <div className="text-[10px] text-gray-500 font-medium mt-0.5">Downloads</div>
              </div>
              <div className="border-l border-gray-200">
                <div className="text-sm font-bold text-gray-900">2001</div>
                <div className="text-[10px] text-gray-500 font-medium mt-0.5">Launch Date</div>
              </div>
            </div>

            {/* 2 Action Buttons (INSTALL APP & PLAY ONLINE) */}
            <div className="px-5 my-5 space-y-3">
              <button 
                onClick={handleDownloadApk}
                className="w-full bg-[#00875A] hover:bg-[#00704A] text-white font-black py-3.5 rounded-xl shadow-sm flex items-center justify-center gap-2 text-sm tracking-wider uppercase transition-all"
              >
                <Download className="w-4 h-4 stroke-[3]" /> INSTALL APP
              </button>

              <button 
                onClick={() => {
                  if (user) {
                    setView('webapp');
                  } else {
                    setAuthStep('phone');
                    setMobileNumber('');
                    setOtpInput('');
                    setAuthError('');
                    setView('auth');
                  }
                }}
                className="w-full bg-white hover:bg-gray-50 text-gray-900 font-black py-3.5 rounded-xl border-2 border-[#333333] shadow-sm flex items-center justify-center gap-2 text-sm tracking-wider uppercase transition-all"
              >
                <Play className="w-4 h-4 fill-gray-900 text-gray-900" /> PLAY ONLINE
              </button>
            </div>

            {/* Dual Phone Screenshots Section (Exact Copy of matkagold.com!) */}
            <div className="px-5 mt-6 relative">
              <div className="relative flex items-center justify-center">
                <div className="flex gap-4 overflow-x-auto scrollbar-none py-2 px-1 w-full justify-center">
                  
                  {/* Phone Card 1: 24/7 Customer Support */}
                  <div className="min-w-[210px] max-w-[210px] h-[340px] bg-gradient-to-b from-[#9A6B1F] via-[#D97706] to-[#451A03] rounded-3xl p-3 shadow-xl relative overflow-hidden flex flex-col justify-between border border-[#FFE485]/40">
                    {/* Gold Coins Background Pattern Overlay */}
                    <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#FFF_1px,transparent_1px)] [background-size:8px_8px] pointer-events-none"></div>

                    <h4 className="text-sm font-bold text-white text-center drop-shadow-md z-10">24/7 Customer Support</h4>

                    {/* Phone Graphic */}
                    <div className="w-full h-[270px] bg-[#121212] rounded-2xl border-4 border-[#333333] overflow-hidden flex flex-col shadow-2xl relative z-10">
                      <div className="bg-[#00875A] p-2 text-white text-[10px] font-bold flex justify-between items-center">
                        <span>Customer Support</span>
                        <span className="w-2 h-2 rounded-full bg-emerald-300 animate-pulse"></span>
                      </div>
                      <div className="flex-1 bg-[#E5DDD5] p-2 space-y-2 flex flex-col justify-end">
                        <div className="bg-white p-1.5 rounded-lg text-[9px] text-gray-800 self-start shadow-sm max-w-[80%]">
                          Namaste! Kaise help kar sakte hain?
                        </div>
                        <div className="bg-[#DCF8C6] p-1.5 rounded-lg text-[9px] text-gray-800 self-end shadow-sm max-w-[80%]">
                          Deposit fast help chahiye
                        </div>
                      </div>
                      <div className="bg-white p-1.5 border-t border-gray-200 text-[9px] text-gray-400">
                        Type a message...
                      </div>
                    </div>
                  </div>

                  {/* Phone Card 2: Earn Money With Refer */}
                  <div className="min-w-[210px] max-w-[210px] h-[340px] bg-gradient-to-b from-[#9A6B1F] via-[#D97706] to-[#451A03] rounded-3xl p-3 shadow-xl relative overflow-hidden flex flex-col justify-between border border-[#FFE485]/40">
                    {/* Gold Coins Background Pattern Overlay */}
                    <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#FFF_1px,transparent_1px)] [background-size:8px_8px] pointer-events-none"></div>

                    <h4 className="text-sm font-bold text-[#FFF2B2] text-center drop-shadow-md z-10">Earn Money With Refer</h4>

                    {/* Phone Graphic */}
                    <div className="w-full h-[270px] bg-[#1A1710] rounded-2xl border-4 border-[#333333] overflow-hidden flex flex-col p-2 space-y-2 shadow-2xl relative z-10">
                      <div className="text-[9px] text-gray-400 text-center font-bold">Your Referral Code</div>
                      <div className="bg-[#2A2416] text-[#F3D079] text-[11px] font-mono font-bold py-1.5 text-center rounded-lg border border-[#F3D079]/50 tracking-wider">
                        1B2385682C
                      </div>
                      <div className="grid grid-cols-2 gap-1 text-[8px] font-bold">
                        <div className="bg-[#D97706] text-white p-1 text-center rounded">Copy Code</div>
                        <div className="bg-gray-800 text-white p-1 text-center rounded">Share</div>
                      </div>
                      <div className="bg-[#12100B] p-2 rounded-lg border border-gray-800 text-center space-y-1 mt-auto">
                        <div className="text-[8px] text-gray-400">Total Commissions</div>
                        <div className="text-[10px] font-mono font-bold text-[#00E676]">₹0/-</div>
                      </div>
                    </div>
                  </div>

                </div>

                {/* Left & Right Circle Nav Arrows */}
                <button className="absolute left-0 top-1/2 -translate-y-1/2 bg-white text-gray-800 shadow-xl border border-gray-200 rounded-full p-2.5 hover:bg-gray-50 z-20">
                  <svg className="w-4 h-4 stroke-[3]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/></svg>
                </button>
                <button className="absolute right-0 top-1/2 -translate-y-1/2 bg-white text-gray-800 shadow-xl border border-gray-200 rounded-full p-2.5 hover:bg-gray-50 z-20">
                  <svg className="w-4 h-4 stroke-[3]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/></svg>
                </button>
              </div>

              {/* Dots Indicator */}
              <div className="flex justify-center gap-1.5 mt-3">
                <span className="w-2 h-2 rounded-full bg-gray-800"></span>
                <span className="w-2 h-2 rounded-full bg-gray-300"></span>
              </div>
            </div>

            {/* About This App Section */}
            <div className="px-5 mt-8 border-t border-gray-100 pt-6">
              <h3 className="text-lg font-bold text-gray-900 mb-1">About This App</h3>
              <p className="text-xs text-gray-600 leading-relaxed">
                95X Matka is one of the best khaiwal app you can find in the market
              </p>
              <div className="mt-3 flex items-center gap-2">
                <span className="text-xs font-bold text-gray-900 bg-gray-100 px-3 py-1 rounded-lg">2026</span>
                <span className="text-xs font-medium text-gray-600 bg-gray-100 px-3 py-1 rounded-full">Khaiwal</span>
                <span className="text-xs font-medium text-gray-600 bg-gray-100 px-3 py-1 rounded-full">Gaming</span>
              </div>
            </div>

            {/* Data Safety Section */}
            <div className="px-5 mt-8 border-t border-gray-100 pt-6">
              <h3 className="text-lg font-bold text-gray-900 mb-1">Data Safety</h3>
              <p className="text-xs text-gray-500 leading-relaxed mb-4">
                Safety starts with understanding how developers collect and share your data. Data privacy and security practices may vary based on your use, region and age. The developer provided this information and may update it over time.
              </p>

              <div className="bg-slate-50 p-4 rounded-2xl border border-gray-200 space-y-4">
                <div className="flex gap-3 items-start text-xs text-gray-700">
                  <span className="text-base">🔗</span>
                  <div>
                    <span className="font-bold text-gray-900 block">No data shared with third parties.</span>
                    <span className="text-gray-500">Learn more about how developers declare sharing.</span>
                  </div>
                </div>

                <div className="flex gap-3 items-start text-xs text-gray-700">
                  <span className="text-base">☁️</span>
                  <div>
                    <span className="font-bold text-gray-900 block">No data collected.</span>
                    <span className="text-gray-500">Learn more about how developers declare collection.</span>
                  </div>
                </div>

                <div className="flex gap-3 items-start text-xs text-gray-700">
                  <span className="text-base">🔒</span>
                  <span className="font-bold text-gray-900">Data is encrypted in transit.</span>
                </div>

                <div className="flex gap-3 items-start text-xs text-gray-700">
                  <span className="text-base">🗑️</span>
                  <span className="font-bold text-gray-900">You can request that data be deleted.</span>
                </div>
              </div>
            </div>

            {/* App Reviews Section */}
            <div className="px-5 mt-8 border-t border-gray-100 pt-6">
              <h3 className="text-lg font-bold text-gray-900 mb-3">App Reviews</h3>

              <div className="flex gap-6 items-center mb-6">
                <div>
                  <div className="text-4xl font-extrabold text-gray-900">4.8</div>
                  <div className="text-[11px] text-gray-500 font-medium">12L+</div>
                  <div className="flex text-[#00C853] text-sm mt-1">
                    ★★★★★
                  </div>
                </div>

                {/* Rating Bar Chart */}
                <div className="flex-1 space-y-1.5 text-xs text-gray-500">
                  <div className="flex items-center gap-2">
                    <span>5</span>
                    <div className="flex-1 bg-gray-200 h-2 rounded-full overflow-hidden">
                      <div className="bg-[#00C853] h-full w-[85%]"></div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span>4</span>
                    <div className="flex-1 bg-gray-200 h-2 rounded-full overflow-hidden">
                      <div className="bg-[#00C853] h-full w-[70%]"></div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span>3</span>
                    <div className="flex-1 bg-gray-200 h-2 rounded-full overflow-hidden">
                      <div className="bg-[#00C853] h-full w-[50%]"></div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span>2</span>
                    <div className="flex-1 bg-gray-200 h-2 rounded-full overflow-hidden">
                      <div className="bg-[#00C853] h-full w-[25%]"></div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span>1</span>
                    <div className="flex-1 bg-gray-200 h-2 rounded-full overflow-hidden">
                      <div className="bg-[#00C853] h-full w-[10%]"></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Review Items */}
              <div className="space-y-4">
                <div className="border-b border-gray-100 pb-4">
                  <div className="flex items-center gap-3 mb-1.5">
                    <div className="w-8 h-8 rounded-full bg-teal-500 text-white font-bold flex items-center justify-center text-xs">V</div>
                    <div>
                      <h4 className="text-xs font-bold text-gray-900">Vishal</h4>
                      <div className="flex text-[#00C853] text-xs">★★★★★ <span className="text-[10px] text-gray-400 ml-2">19 November 2024</span></div>
                    </div>
                  </div>
                  <p className="text-xs text-gray-700 leading-relaxed">I've been playing this game from many years, this is the best khaiwal app.</p>
                </div>

                <div className="border-b border-gray-100 pb-4">
                  <div className="flex items-center gap-3 mb-1.5">
                    <div className="w-8 h-8 rounded-full bg-emerald-400 text-white font-bold flex items-center justify-center text-xs">S</div>
                    <div>
                      <h4 className="text-xs font-bold text-gray-900">Suman</h4>
                      <div className="flex text-[#00C853] text-xs">★★★★★ <span className="text-[10px] text-gray-400 ml-2">22 November 2024</span></div>
                    </div>
                  </div>
                  <p className="text-xs text-gray-700 leading-relaxed">Ye khaiwal app meri fav hai, isse acchi app mujhe aaj tak nahi mili, time pe payout milta hai.</p>
                </div>
              </div>
            </div>

            {/* Customer Support Footer Card */}
            <div className="px-5 mt-8">
              <div className="p-4 bg-gray-50 border border-gray-200 rounded-2xl space-y-2">
                <h4 className="text-sm font-bold text-gray-900">Customer Support:</h4>
                <div className="text-xs text-gray-700 space-y-1.5">
                  <p className="flex items-center gap-2">
                    <span>📞</span> Contact: <a href="tel:917027709695" className="text-blue-600 font-bold underline">917027709695</a>
                  </p>
                  <p className="flex items-center gap-2">
                    <span>💬</span> WhatsApp: <a href="https://wa.me/917027709695" target="_blank" rel="noreferrer" className="text-blue-600 font-bold underline">917027709695</a>
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* VIEW 2: AUTHENTICATION FLOW (Same as Mobile App!)        */}
        {/* ========================================================= */}
        {view === 'auth' && (
          <div className="flex-1 bg-[#0F172A] p-6 flex flex-col justify-between">
            <div>
              {/* Back to Landing Header */}
              <button onClick={() => setView('landing')} className="flex items-center gap-2 text-xs font-bold text-[#94A3B8] mb-6">
                <ArrowLeft className="w-4 h-4" /> Back to Home
              </button>

              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-gradient-to-br from-[#F3D079] via-[#D97706] to-[#78350F] rounded-2xl p-1 mx-auto shadow-lg flex items-center justify-center border border-[#F3D079]/50 mb-3">
                  <span className="text-2xl">👑</span>
                </div>
                <h2 className="text-2xl font-black text-[#FFE485]">95X MATKA</h2>
                <p className="text-xs text-gray-400 mt-1">आपका भरोसा, हमारी पहचान</p>
              </div>

              {authError && (
                <div className="bg-red-500/20 border border-red-500/50 text-red-400 p-3 rounded-xl text-xs font-bold mb-4 text-center">
                  {authError}
                </div>
              )}

              {/* STEP 1: Phone Number */}
              {authStep === 'phone' && (
                <form onSubmit={handlePhoneSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Mobile Number</label>
                    <div className="flex bg-[#1E293B] border border-[#334155] rounded-xl overflow-hidden">
                      <span className="px-3.5 py-3 text-sm font-bold text-gray-400 border-r border-[#334155] bg-[#0F172A] flex items-center">+91</span>
                      <input
                        type="tel"
                        maxLength={10}
                        placeholder="Enter 10 digit number"
                        value={mobileNumber}
                        onChange={(e) => setMobileNumber(e.target.value.replace(/[^0-9]/g, ''))}
                        className="w-full bg-transparent p-3 text-sm text-white focus:outline-none font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Referral Code (Optional)</label>
                    <div className="flex bg-[#1E293B] border border-[#334155] rounded-xl overflow-hidden">
                      <span className="px-3.5 py-3 text-sm font-bold text-[#F3D079] border-r border-[#334155] bg-[#0F172A] flex items-center">🎁</span>
                      <input
                        type="text"
                        placeholder="Enter Referral Code (e.g. REF7027709695)"
                        value={referralCodeInput}
                        onChange={(e) => setReferralCodeInput(e.target.value.toUpperCase())}
                        className="w-full bg-transparent p-3 text-sm text-[#F3D079] focus:outline-none font-mono tracking-wider uppercase"
                      />
                    </div>
                  </div>

                  <button type="submit" className="w-full bg-[#00C853] hover:bg-[#00B248] text-white font-black py-3.5 rounded-xl shadow-lg text-sm tracking-wider uppercase transition-all">
                    GET OTP ➔
                  </button>
                </form>
              )}

              {/* STEP 2: 4-Digit OTP */}
              {authStep === 'otp' && (
                <div className="space-y-6 text-center">
                  <div>
                    <h3 className="text-lg font-bold text-white">Enter OTP</h3>
                    <p className="text-xs text-gray-400 mt-1">Sent to +91 {mobileNumber}</p>
                  </div>

                  <div className="relative flex justify-center gap-3 my-4">
                    <input
                      type="tel"
                      maxLength={4}
                      autoFocus
                      value={otpInput}
                      onChange={(e) => {
                        const val = e.target.value.replace(/[^0-9]/g, '');
                        setOtpInput(val);
                        handleOtpSubmit(val);
                      }}
                      className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
                    />
                    {[0, 1, 2, 3].map((idx) => (
                      <div key={idx} className="w-12 h-14 bg-[#1E293B] border-2 border-[#F3D079] rounded-xl flex items-center justify-center text-xl font-bold font-mono text-[#FFE485]">
                        {otpInput[idx] || ''}
                      </div>
                    ))}
                  </div>

                  <button onClick={() => setAuthStep('phone')} className="text-xs text-[#00C853] font-bold">
                    Change Mobile Number
                  </button>
                </div>
              )}

              {/* STEP 3: Register Details */}
              {authStep === 'register' && (
                <form onSubmit={handleRegisterSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Full Name</label>
                    <input
                      type="text"
                      placeholder="Enter your full name"
                      value={registerName}
                      onChange={(e) => setRegisterName(e.target.value)}
                      className="w-full bg-[#1E293B] border border-[#334155] rounded-xl p-3 text-sm text-white focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Referral Code (Optional)</label>
                    <input
                      type="text"
                      placeholder="Enter referral code (e.g. REF1472580369)"
                      value={referralCodeInput}
                      onChange={(e) => setReferralCodeInput(e.target.value.toUpperCase())}
                      className="w-full bg-[#1E293B] border border-[#334155] rounded-xl p-3 text-sm text-[#FFE485] font-mono focus:outline-none uppercase"
                    />
                  </div>

                  <button type="submit" className="w-full bg-[#00C853] hover:bg-[#00B248] text-white font-black py-3.5 rounded-xl shadow-lg text-sm tracking-wider uppercase transition-all">
                    COMPLETE REGISTRATION 🚀
                  </button>
                </form>
              )}
            </div>

            <div className="text-center text-xs text-gray-500 py-4">
              By continuing you agree to 95X Matka Terms & Conditions
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* VIEW 3: WEB APP PLAYER PORTAL (100% Mobile App Replica!)   */}
        {/* ========================================================= */}
        {view === 'webapp' && (
          <div className="flex-1 bg-[#090D16] text-white flex flex-col pb-20 min-h-screen">
            {/* SIDE MENU DRAWER OVERLAY & PANEL */}
            {isSideMenuOpen && (
              <div className="fixed inset-0 z-50 flex">
                {/* Dark Backdrop Overlay */}
                <div 
                  className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity"
                  onClick={() => setIsSideMenuOpen(false)}
                />

                {/* Left Side Drawer */}
                <div className="relative w-80 max-w-[85vw] bg-[#0F172A] border-r border-gray-800 h-full flex flex-col z-50 shadow-2xl overflow-y-auto animate-in slide-in-from-left duration-300">
                  {/* Drawer Header (Clickable Profile) */}
                  <div 
                    onClick={() => {
                      setShowProfileModal(true);
                      setIsSideMenuOpen(false);
                    }}
                    className="p-5 bg-gradient-to-r from-[#1E293B] to-[#0F172A] border-b border-gray-800 flex justify-between items-center cursor-pointer hover:bg-gray-800/50 transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#00C853] to-[#00897B] flex items-center justify-center text-xl font-bold text-white shadow-lg border border-emerald-400/30">
                        👑
                      </div>
                      <div>
                        <h3 className="text-sm font-black text-white">{user?.name || 'Player'}</h3>
                        <p className="text-[11px] text-gray-400 font-mono">+91 {user?.mobile || '9999999999'}</p>
                        <div className="mt-1 inline-flex items-center gap-1 bg-[#00C853]/15 border border-[#00C853]/40 px-2 py-0.5 rounded-full text-[10px] font-bold text-[#00C853]">
                          💵 ₹{user?.balance ? user.balance.toFixed(2) : '0.00'}
                        </div>
                      </div>
                    </div>

                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsSideMenuOpen(false);
                      }}
                      className="w-8 h-8 rounded-full bg-gray-800 text-gray-400 hover:text-white flex items-center justify-center text-sm font-bold"
                    >
                      ✕
                    </button>
                  </div>

                  {/* Drawer Menu Items */}
                  <div className="p-4 space-y-1.5 flex-1">
                    <button
                      onClick={() => {
                        setActiveWebTab('home');
                        setIsSideMenuOpen(false);
                      }}
                      className="w-full flex items-center gap-3.5 px-4 py-3 rounded-xl text-xs font-bold text-gray-200 hover:bg-[#1E293B] hover:text-white transition-all text-left"
                    >
                      <span className="text-base">🏠</span> Home
                    </button>

                    <button
                      onClick={() => {
                        setActiveWebTab('charts');
                        setIsSideMenuOpen(false);
                      }}
                      className="w-full flex items-center gap-3.5 px-4 py-3 rounded-xl text-xs font-bold text-gray-200 hover:bg-[#1E293B] hover:text-white transition-all text-left"
                    >
                      <span className="text-base">📊</span> Charts & Results
                    </button>

                    <button
                      onClick={() => {
                        setActiveWebTab('mybets');
                        setIsSideMenuOpen(false);
                      }}
                      className="w-full flex items-center gap-3.5 px-4 py-3 rounded-xl text-xs font-bold text-gray-200 hover:bg-[#1E293B] hover:text-white transition-all text-left"
                    >
                      <span className="text-base">📜</span> My Bet History
                    </button>

                    <div className="my-2 border-t border-gray-800/80" />

                    <button
                      onClick={() => {
                        setShowDepositModal(true);
                        setIsSideMenuOpen(false);
                      }}
                      className="w-full flex items-center gap-3.5 px-4 py-3 rounded-xl text-xs font-bold text-[#00C853] hover:bg-[#00C853]/10 transition-all text-left"
                    >
                      <span className="text-base">💵</span> Add Cash (Deposit)
                    </button>

                    <button
                      onClick={() => {
                        setShowWithdrawModal(true);
                        setIsSideMenuOpen(false);
                      }}
                      className="w-full flex items-center gap-3.5 px-4 py-3 rounded-xl text-xs font-bold text-[#F3D079] hover:bg-[#F3D079]/10 transition-all text-left"
                    >
                      <span className="text-base">🏦</span> Withdraw Cash
                    </button>

                    <div className="my-2 border-t border-gray-800/80" />

                    <button
                      onClick={() => {
                        setShowReferralModal(true);
                        setIsSideMenuOpen(false);
                      }}
                      className="w-full flex items-center gap-3.5 px-4 py-3 rounded-xl text-xs font-bold text-[#FFE485] hover:bg-[#F3D079]/10 transition-all text-left"
                    >
                      <span className="text-base">🎁</span> Refer & Earn (₹50 Bonus)
                    </button>

                    <a
                      href="https://wa.me/917027709695"
                      target="_blank"
                      rel="noreferrer"
                      onClick={() => setIsSideMenuOpen(false)}
                      className="w-full flex items-center gap-3.5 px-4 py-3 rounded-xl text-xs font-bold text-gray-200 hover:bg-[#1E293B] hover:text-white transition-all text-left"
                    >
                      <span className="text-base">💬</span> Customer Support
                    </a>

                    <button
                      onClick={() => {
                        setShowRulesModal(true);
                        setIsSideMenuOpen(false);
                      }}
                      className="w-full flex items-center gap-3.5 px-4 py-3 rounded-xl text-xs font-bold text-gray-200 hover:bg-[#1E293B] hover:text-white transition-all text-left"
                    >
                      <span className="text-base">📋</span> Rules & Rates
                    </button>

                    <button
                      onClick={() => {
                        setUser(null);
                        localStorage.removeItem('95x_web_user');
                        setAuthStep('phone');
                        setMobileNumber('');
                        setOtpInput('');
                        setAuthError('');
                        setView('landing');
                        setIsSideMenuOpen(false);
                      }}
                      className="w-full flex items-center gap-3.5 px-4 py-3 rounded-xl text-xs font-bold text-red-400 hover:bg-red-500/10 transition-all text-left mt-4"
                    >
                      <span className="text-base">🚪</span> Logout
                    </button>
                  </div>

                  {/* Drawer Footer */}
                  <div className="p-4 border-t border-gray-800 text-center text-[10px] text-gray-500">
                    95X Matka v2.4 · 100% Safe & Secure
                  </div>
                </div>
              </div>
            )}

            {/* Top Android App Header */}
            <div className="px-4 py-3 bg-[#0F172A]/90 backdrop-blur-md border-b border-gray-800 flex justify-between items-center sticky top-0 z-20 shadow-md">
              <div className="flex items-center gap-2.5">
                <button 
                  onClick={() => setIsSideMenuOpen(true)}
                  className="text-gray-300 hover:text-white transition-all active:scale-95 p-1 rounded-lg hover:bg-gray-800"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"/>
                  </svg>
                </button>
                <img src="/app_logo.png" alt="95X MATKA" className="w-7 h-7 rounded-lg object-contain bg-[#0F172A] border border-gray-700" />
                <h3 className="text-sm font-black text-white tracking-wider">95X MATKA</h3>
              </div>

              {/* Wallet Balance Box */}
              <button 
                onClick={() => setShowDepositModal(true)}
                className="flex items-center gap-1.5 bg-[#00C853] text-white px-3 py-1.5 rounded-xl text-xs font-bold font-mono shadow-md hover:bg-[#00B248]"
              >
                <span>💵</span>
                <span>• ₹{user?.balance ? user.balance.toFixed(2) : '0.00'}</span>
              </button>
            </div>

            {/* Contact Support Pill Button (Matching Android App Image 1!) */}
            <div className="p-4">
              <a 
                href="https://wa.me/917027709695" 
                target="_blank" 
                rel="noreferrer"
                className="w-full bg-[#00C853] hover:bg-[#00B248] text-white font-bold py-3 px-4 rounded-full flex justify-between items-center shadow-lg transition-all"
              >
                <div className="flex items-center gap-2 text-xs uppercase tracking-wider">
                  <span className="text-sm">💬</span> Contact Support
                </div>
                <div className="w-7 h-7 bg-white text-[#00C853] rounded-full flex items-center justify-center text-xs shadow-inner font-bold">
                  💬
                </div>
              </a>
            </div>

            {/* Promotional Banner Card */}
            <div className="px-4 mb-4">
              <div className="relative overflow-hidden rounded-2xl border-2 border-[#D4AF37]/60 bg-gradient-to-br from-[#1E293B] to-[#0F172A] p-2 shadow-2xl">
                {bannerConfig?.imageUrl ? (
                  <img src={bannerConfig.imageUrl} alt="Promotional Banner" className="w-full h-44 rounded-xl object-contain" />
                ) : (
                  <div className="text-center py-6 px-4 space-y-2">
                    <h4 className="text-lg font-black text-[#FFE485] tracking-wider">👑 95X MATKA SATTA</h4>
                    <p className="text-xs text-gray-300">❖ आपका भरोसा, हमारी पहचान ❖</p>
                    <div className="flex justify-around items-center bg-gray-900/80 p-2 rounded-xl text-[10px] font-bold text-[#F3D079] mt-3 border border-yellow-500/20">
                      <span>⚡ MIN DEPOSIT: ₹{bannerConfig?.minDeposit || 100}</span>
                      <span>🏦 MIN WITHDRAWAL: ₹{bannerConfig?.minWithdrawal || 500}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* TAB CONTENT: HOME (100% Strictly Separated Results & Live Games - Zero Duplication!) */}
            {activeWebTab === 'home' && (
              <div className="px-4 space-y-6">
                {/* SECTION 1: RESULTS (Only closed or declared games!) */}
                <div className="space-y-3">
                  <h3 className="text-base font-bold text-white mb-2">Results</h3>

                  <div className="space-y-3">
                    {Object.keys(DEFAULT_SCHEDULES).filter((gameName) => {
                      return !isGameBettingOpen(gameName, DEFAULT_SCHEDULES[gameName]);
                    }).length === 0 ? (
                      <div className="text-center py-5 bg-[#121927] rounded-2xl border border-gray-800 text-gray-400 text-xs font-semibold">
                        No closed results yet for today. Live games open below!
                      </div>
                    ) : (
                      Object.keys(DEFAULT_SCHEDULES).filter((gameName) => {
                        return !isGameBettingOpen(gameName, DEFAULT_SCHEDULES[gameName]);
                      }).map((gameName) => {
                        const result = declaredResults[gameName] ?? declaredResults[gameName === 'Desawar' ? 'Disawer' : (gameName === 'Shree Ganesh' ? 'Shri Ganesh' : gameName)];
                        const isDeclared = (result !== undefined && result !== null);
                        const sched = DEFAULT_SCHEDULES[gameName];

                        // Custom emblems matching Android app image!
                        const iconEmoji = 
                          gameName.includes('Dubai') ? '🏙️' :
                          gameName.includes('Shree') || gameName.includes('Ganesh') ? '🏛️' :
                          gameName.includes('Faridabad') ? '💎' :
                          gameName.includes('Ghaziabad') ? '🏛️' :
                          gameName.includes('Gali') ? '⚡' :
                          gameName.includes('Shiv') ? '🔱' :
                          gameName.includes('Delhi') ? '🏛️' : '👑';

                        return (
                          <div 
                            key={`result_${gameName}`}
                            onClick={() => {
                              setSelectedGameForBetting(gameName);
                              setBetMessage('');
                            }}
                            className="bg-[#121927] hover:bg-[#1A2337] p-3.5 rounded-2xl border border-gray-800 shadow-lg flex justify-between items-center cursor-pointer transition-all active:scale-[0.99]"
                          >
                            <div className="flex items-center gap-3">
                              {/* 3D Emblem Badge Box */}
                              <div className="w-12 h-12 bg-gradient-to-br from-[#1E293B] to-[#0F172A] border border-[#D4AF37]/50 rounded-xl flex items-center justify-center text-xl shadow-inner shrink-0">
                                {iconEmoji}
                              </div>

                              <div>
                                <h4 className="text-sm font-bold text-white">{gameName}</h4>
                                {isDeclared ? (
                                  <p className="text-[11px] text-gray-400 mt-0.5 font-medium">Winning Number</p>
                                ) : (
                                  <p className="text-[11px] text-gray-400 mt-0.5">
                                    Result to be announced soon at <span className="font-semibold text-gray-300">{sched.close}</span>
                                  </p>
                                )}
                              </div>
                            </div>

                            {/* Right Status Badge (Declared Result Circle or LIVE Badge) */}
                            {isDeclared ? (
                              <div className="w-9 h-9 rounded-full bg-[#091F17] border-2 border-[#00C853] flex items-center justify-center font-mono font-black text-sm text-[#00C853] shadow-md shrink-0">
                                {String(result).padStart(2, '0')}
                              </div>
                            ) : (
                              <span className="px-2.5 py-1 rounded-full bg-red-950/80 border border-red-500/50 text-[10px] font-bold text-red-400 uppercase tracking-wider flex items-center gap-1 shrink-0">
                                <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></span>
                                LIVE
                              </span>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

                {/* SECTION 2: LIVE GAMES (Only games currently OPEN for betting!) */}
                <div className="space-y-3">
                  <h3 className="text-base font-bold text-white mb-2">Live Games</h3>

                  <div className="space-y-3">
                    {Object.keys(DEFAULT_SCHEDULES).filter((gameName) => {
                      return isGameBettingOpen(gameName, DEFAULT_SCHEDULES[gameName]);
                    }).length === 0 ? (
                      <div className="text-center py-6 bg-[#121927] rounded-2xl border border-gray-800 text-gray-400 text-xs font-semibold">
                        No games currently open for betting. Check results above!
                      </div>
                    ) : (
                      Object.keys(DEFAULT_SCHEDULES).filter((gameName) => {
                        return isGameBettingOpen(gameName, DEFAULT_SCHEDULES[gameName]);
                      }).map((gameName) => {
                        const sched = DEFAULT_SCHEDULES[gameName];

                        return (
                          <div 
                            key={`live_${gameName}`}
                            className="bg-[#121927] p-4 rounded-2xl border border-gray-800 shadow-xl flex justify-between items-center"
                          >
                            <div className="flex items-center gap-3">
                              {/* 3D Gold Crown Emblem Badge */}
                              <div className="w-12 h-12 bg-gradient-to-br from-[#1E293B] to-[#0F172A] border border-[#D4AF37]/60 rounded-xl flex items-center justify-center text-xl shadow-inner shrink-0">
                                👑
                              </div>

                              <div>
                                <h4 className="text-sm font-bold text-white">{gameName}</h4>
                                <p className="text-[10px] text-gray-400 mt-0.5">
                                  Open: <span className="text-gray-300 font-semibold">{sched.open}</span> · Close: <span className="text-gray-300 font-semibold">{sched.close}</span>
                                </p>
                                <div className="mt-1.5">
                                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#00C853]/15 border border-[#00C853]/40 text-[9px] font-extrabold text-[#00C853] uppercase tracking-wider">
                                    <span className="w-1.5 h-1.5 rounded-full bg-[#00C853] animate-ping"></span>
                                    BETTING OPEN
                                  </span>
                                </div>
                              </div>
                            </div>

                            {/* Bright Cyan/Green Action Button: PLAY ➔ */}
                            <button
                              onClick={() => {
                                setSelectedGameForBetting(gameName);
                                setBetMessage('');
                              }}
                              className="bg-[#00E676] hover:bg-[#00C853] text-slate-950 font-black px-4 py-2 rounded-xl text-xs uppercase tracking-wider shadow-lg flex items-center gap-1 shrink-0 transition-all active:scale-95"
                            >
                              PLAY ➔
                            </button>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* TAB CONTENT: MY BETS */}
            {activeWebTab === 'mybets' && (
              <div className="px-4 space-y-3">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-2">My Bet History</h3>
                {myBetsList.length === 0 ? (
                  <div className="text-center text-gray-400 py-12 bg-[#121927] rounded-2xl border border-gray-800">
                    <p className="text-sm">No bets placed yet.</p>
                  </div>
                ) : (
                  myBetsList.map((bet, idx) => (
                    <div key={idx} className="bg-[#121927] p-3.5 rounded-xl border border-gray-800 flex justify-between items-center shadow-md">
                      <div>
                        <span className="text-xs font-bold text-[#FFE485]">{bet.game_name} ({bet.bet_type})</span>
                        <p className="text-xs text-white font-mono mt-0.5">Number: <span className="font-bold text-[#00C853]">{bet.number}</span> | Amount: ₹{bet.bet_amount}</p>
                      </div>
                      <span className={`text-[10px] font-bold px-2.5 py-1 rounded-lg uppercase ${
                        bet.status === 'won' ? 'bg-green-500/20 text-green-400 border border-green-500/40' :
                        bet.status === 'lost' ? 'bg-red-500/20 text-red-400 border border-red-500/40' :
                        'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                      }`}>
                        {bet.status}
                      </span>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* TAB CONTENT: CHARTS (100% Interactive & Working!) */}
            {activeWebTab === 'charts' && (
              <div className="px-4 space-y-4">
                {/* Header Title */}
                <h3 className="text-base font-bold text-white text-center mb-3">Charts & Results</h3>

                {/* Date Filter Pills Bar */}
                <div className="flex gap-2 justify-center mb-4">
                  <button 
                    onClick={() => setChartFilter('today')}
                    className={`px-4 py-1.5 rounded-full font-bold text-xs shadow-md transition-all ${
                      chartFilter === 'today' ? 'bg-[#EAB308] text-slate-950' : 'bg-[#1E293B] text-gray-300 hover:text-white border border-gray-800'
                    }`}
                  >
                    Today
                  </button>
                  <button 
                    onClick={() => setChartFilter('yesterday')}
                    className={`px-4 py-1.5 rounded-full font-bold text-xs shadow-md transition-all ${
                      chartFilter === 'yesterday' ? 'bg-[#EAB308] text-slate-950' : 'bg-[#1E293B] text-gray-300 hover:text-white border border-gray-800'
                    }`}
                  >
                    Yesterday
                  </button>
                  {/* Interactive Calendar Date Picker */}
                  <div 
                    onClick={(e) => {
                      const inp = e.currentTarget.querySelector('input');
                      if (inp) {
                        try {
                          inp.showPicker();
                        } catch (err) {
                          inp.focus();
                          inp.click();
                        }
                      }
                    }}
                    className={`px-3 py-1.5 rounded-full border text-xs font-bold flex items-center gap-1.5 shadow-md transition-all cursor-pointer relative ${
                      chartFilter === 'custom' ? 'bg-[#EAB308] text-slate-950 border-[#EAB308]' : 'bg-[#1E293B] border-gray-800 text-gray-300 hover:text-white'
                    }`}
                  >
                    <span>📅</span>
                    <span>{formatChartDateDisplay(selectedChartDate)}</span>
                    <input
                      type="date"
                      value={selectedChartDate}
                      onChange={(e) => {
                        if (e.target.value) {
                          setSelectedChartDate(e.target.value);
                          setChartFilter('custom');
                        }
                      }}
                      className="absolute inset-0 opacity-0 cursor-pointer w-full h-full pointer-events-none"
                    />
                  </div>
                </div>

                {/* Market Result Cards List */}
                <div className="space-y-3">
                  {Object.keys(DEFAULT_SCHEDULES).map((gameName) => {
                    // Fetch live result for requested date from MongoDB & Backend API
                    const result = dateChartResults[gameName] !== undefined 
                      ? dateChartResults[gameName] 
                      : (dateChartResults[gameName === 'Desawar' ? 'Disawer' : gameName] || (chartFilter === 'today' ? declaredResults[gameName] : undefined));

                    const displayNum = (result !== undefined && result !== null && result !== '') ? String(result).padStart(2, '0') : '--';

                    // 3D Hexagon Emblem Icon matching Image 2!
                    const iconEmoji = 
                      gameName.includes('Desawar') ? '🎲' :
                      gameName.includes('Faridabad') || gameName.includes('Ghaziabad') || gameName.includes('Gali') ? '🏢' : '👑';

                    return (
                      <div 
                        key={gameName}
                        onClick={() => {
                          setSelectedGameForBetting(gameName);
                          setBetMessage('');
                        }}
                        className="bg-[#121927] hover:bg-[#1A2337] p-3.5 rounded-2xl border border-gray-800 shadow-lg flex justify-between items-center cursor-pointer transition-all active:scale-[0.99]"
                      >
                        <div className="flex items-center gap-3">
                          {/* 3D Gold Hexagon Emblem Badge */}
                          <div className="w-12 h-12 bg-gradient-to-br from-[#1E293B] to-[#0F172A] border border-[#D4AF37]/60 rounded-xl flex items-center justify-center text-xl shadow-inner shrink-0">
                            {iconEmoji}
                          </div>

                          <div>
                            <h4 className="text-sm font-bold text-white">{gameName}</h4>
                            <p className="text-[11px] text-gray-400 mt-0.5">Winner Number · <span className="text-[#00C853] font-semibold">Tap to Play</span></p>
                          </div>
                        </div>

                        {/* Right Gold Winner Number Badge Box */}
                        <div className="w-12 h-10 rounded-xl bg-[#0F172A] border border-[#D4AF37]/50 flex items-center justify-center font-mono font-bold text-base text-[#FFE485] shadow-md shrink-0">
                          {displayNum}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* TAB CONTENT: REFERRAL (Matches in-app tab layout!) */}
            {activeWebTab === 'referral' && (
              <div className="px-4 space-y-4">
                <h3 className="text-base font-bold text-white text-center mb-3">Refer & Earn Rewards</h3>

                {/* CARD 1: TOTAL COMMISSION */}
                <div className="bg-[#1E293B] rounded-2xl shadow-lg border border-[#334155] overflow-hidden">
                  <div className="bg-[#162238] px-4 py-2.5 flex justify-between items-center text-white">
                    <div className="flex items-center gap-2">
                      <span className="text-sm">🎟️</span>
                      <span className="text-xs font-black tracking-wider uppercase">TOTAL COMMISSION</span>
                    </div>
                    <button 
                      onClick={fetchWebsiteReferralDetails}
                      className="text-xs hover:rotate-180 transition-transform p-1"
                    >
                      🔄
                    </button>
                  </div>
                  <div className="p-4">
                    <div className="bg-[#0F172A] border-2 border-[#F3D079] rounded-2xl py-4 text-center">
                      <span className="text-2xl font-mono font-black text-[#F3D079]">
                        ₹{referralDetails.totalCommission || 0}/-
                      </span>
                    </div>
                  </div>
                </div>

                {/* CARD 2: YOUR REFERRAL CODE */}
                <div className="bg-[#1E293B] rounded-2xl shadow-lg border border-[#334155] overflow-hidden">
                  <div className="bg-[#00873E] px-4 py-2.5 flex items-center gap-2 text-white">
                    <span className="text-sm">🎁</span>
                    <span className="text-xs font-black tracking-wider uppercase">YOUR REFERRAL CODE</span>
                  </div>
                  <div className="p-4 text-center">
                    {(() => {
                      const userRefCode = referralDetails.referral_code || user?.referral_code || (user?.mobile ? `REF${user.mobile.slice(-10)}` : 'REF1472580369');
                      const shareText = `Play 95X Matka & Win 95X! 👑\nUse my Referral Code: ${userRefCode} to get bonus balance!\nPlay online: https://matka-website.vercel.app`;
                      const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`;

                      return (
                        <div className="space-y-4">
                          <div className="bg-[#0F172A] border-2 border-[#F3D079] rounded-2xl py-3.5 px-3">
                            <div className="text-xl font-mono font-black text-[#F3D079] tracking-[0.2em] select-all whitespace-nowrap overflow-x-auto">
                              {userRefCode}
                            </div>
                          </div>

                          <div className="text-xs font-semibold text-[#94A3B8]">
                            https://matka-website.vercel.app/
                          </div>

                          {/* Side-by-Side Action Buttons */}
                          <div className="grid grid-cols-2 gap-3">
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(shareText);
                                setCopiedToast(true);
                                setTimeout(() => setCopiedToast(false), 2500);
                              }}
                              className="bg-[#00873E] hover:bg-[#007033] text-white font-bold py-2.5 px-3 rounded-xl flex justify-center items-center gap-2 text-xs uppercase tracking-wider shadow-sm transition-all"
                            >
                              <span>📋</span>
                              <span>{copiedToast ? 'COPIED!' : 'Copy Code'}</span>
                            </button>

                            <a
                              href={whatsappUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="bg-[#F59E0B] hover:bg-[#D97706] text-[#0F172A] font-black py-2.5 px-3 rounded-xl flex justify-center items-center gap-2 text-xs uppercase tracking-wider shadow-sm transition-all"
                            >
                              <span>🔀</span>
                              <span>Share</span>
                            </a>
                          </div>

                          {/* Step Process Indicator */}
                          <div className="grid grid-cols-3 gap-2 pt-3 border-t border-[#334155]">
                            <div className="flex flex-col items-center">
                              <div className="w-7 h-7 rounded-full bg-[#0F172A] border border-[#F3D079] flex items-center justify-center font-black text-xs text-[#F3D079] mb-1">1</div>
                              <span className="text-[10px] font-medium text-[#94A3B8]">Share your code</span>
                            </div>
                            <div className="flex flex-col items-center">
                              <div className="w-7 h-7 rounded-full bg-[#0F172A] border border-[#F3D079] flex items-center justify-center font-black text-xs text-[#F3D079] mb-1">2</div>
                              <span className="text-[10px] font-medium text-[#94A3B8]">They sign up</span>
                            </div>
                            <div className="flex flex-col items-center">
                              <div className="w-7 h-7 rounded-full bg-[#0F172A] border border-[#F3D079] flex items-center justify-center font-black text-xs text-[#F3D079] mb-1">3</div>
                              <span className="text-[10px] font-medium text-[#94A3B8]">You earn</span>
                            </div>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                </div>

                {/* CARD 2.5: APPLY REFERRAL CODE FOR EXISTING USERS */}
                <div className="bg-[#1E293B] rounded-2xl shadow-lg border border-[#334155] p-4 text-center space-y-3">
                  <div className="flex items-center justify-center gap-2 text-xs font-black text-[#F3D079] uppercase tracking-wider">
                    <span>🎁</span>
                    <span>HAVE A REFERRAL CODE? APPLY HERE</span>
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Enter Referral Code (e.g. REF1111111111)"
                      value={applyRefInput}
                      onChange={(e) => setApplyRefInput(e.target.value.toUpperCase())}
                      className="flex-1 bg-[#0F172A] border border-[#334155] rounded-xl px-3 py-2 text-xs text-[#F3D079] font-mono uppercase focus:outline-none"
                    />
                    <button
                      onClick={handleApplyReferralCode}
                      className="bg-[#00C853] hover:bg-[#00B248] text-white font-bold px-4 py-2 rounded-xl text-xs uppercase tracking-wider shadow-md transition-all shrink-0"
                    >
                      APPLY
                    </button>
                  </div>
                  {applyRefStatus && (
                    <p className={`text-xs font-bold ${applyRefStatus.includes('success') || applyRefStatus.includes('🎉') ? 'text-[#00C853]' : 'text-red-400'}`}>
                      {applyRefStatus}
                    </p>
                  )}
                </div>

                {/* CARD 3: TOTAL REFERRALS */}
                <div className="bg-[#1E293B] rounded-2xl shadow-lg border border-[#334155] overflow-hidden">
                  <div className="bg-[#162238] px-4 py-2.5 flex justify-between items-center text-white">
                    <div className="flex items-center gap-2">
                      <span className="text-sm">👥</span>
                      <span className="text-xs font-black tracking-wider uppercase">TOTAL REFERRALS</span>
                    </div>
                    <div className="bg-[#0F172A] border border-[#F3D079] text-[#F3D079] px-2.5 py-0.5 rounded-full text-xs font-black flex items-center gap-1">
                      <span>👤</span>
                      <span>{referralDetails.referralsCount || 0}</span>
                    </div>
                  </div>

                  <div className="p-4 text-center">
                    {referralDetails.referredUsers.length === 0 ? (
                      <div className="py-4">
                        <div className="text-4xl mb-2">👥</div>
                        <p className="text-sm font-bold text-[#94A3B8]">No referrals yet</p>
                        <p className="text-[11px] text-[#64748B] mt-1">Share your code above to start earning bonus & lifetime 4% bet commissions!</p>
                      </div>
                    ) : (
                      <div className="text-left space-y-2.5">
                        {referralDetails.referredUsers.map((ref, idx) => (
                          <div key={idx} className="p-3.5 bg-[#0F172A] rounded-xl border border-[#334155] flex justify-between items-center text-xs">
                            <div>
                              <p className="font-bold text-white text-sm">{ref.name}</p>
                              <p className="text-[#94A3B8] font-mono text-[11px] mt-0.5">{ref.mobile} • {ref.date}</p>
                              <p className="text-[11px] text-[#F3D079] font-semibold mt-1">
                                Bonus: ₹{ref.bonus} • 4% Bet Comm: ₹{ref.betCommission.toFixed(2)}
                              </p>
                            </div>
                            <div className="text-right">
                              <span className="font-mono font-black text-[#00C853] text-base">+₹{ref.totalEarned.toFixed(2)}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Bottom 5-Icon Navigation Bar (100% Copy of media_1787416911507.png!) */}
            <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-[#0F172A] border-t border-gray-800/90 py-2 px-3 flex justify-around items-center z-50 shadow-2xl backdrop-blur-md">
              <button 
                onClick={() => {
                  setSelectedGameForBetting(null);
                  setActiveWebTab('home');
                }}
                className={`flex flex-col items-center gap-1 text-[10px] font-black uppercase tracking-wider transition-all ${
                  activeWebTab === 'home' && !selectedGameForBetting ? 'text-white' : 'text-gray-400 hover:text-gray-200'
                }`}
              >
                <span className="text-lg">🏠</span>
                <span>HOME</span>
              </button>

              <button 
                onClick={() => {
                  setSelectedGameForBetting(null);
                  setActiveWebTab('charts');
                }}
                className={`flex flex-col items-center gap-1 text-[10px] font-black uppercase tracking-wider transition-all ${
                  activeWebTab === 'charts' ? 'text-white' : 'text-gray-400 hover:text-gray-200'
                }`}
              >
                <span className="text-lg">📊</span>
                <span>CHART</span>
              </button>

              <button 
                onClick={() => {
                  setSelectedGameForBetting(null);
                  setActiveWebTab('mybets');
                }}
                className={`flex flex-col items-center gap-1 text-[10px] font-black uppercase tracking-wider transition-all ${
                  activeWebTab === 'mybets' ? 'text-white' : 'text-gray-400 hover:text-gray-200'
                }`}
              >
                <span className="text-lg">🕒</span>
                <span>MY BET</span>
              </button>

              <a 
                href="https://wa.me/917027709695" 
                target="_blank" 
                rel="noreferrer"
                className="flex flex-col items-center gap-1 text-[10px] font-black uppercase tracking-wider text-gray-400 hover:text-gray-200 transition-all"
              >
                <span className="text-lg">🎧</span>
                <span>CHAT</span>
              </a>

              <button 
                onClick={() => {
                  setSelectedGameForBetting(null);
                  setActiveWebTab('referral');
                }}
                className={`flex flex-col items-center gap-1 text-[10px] font-black uppercase tracking-wider transition-all ${
                  activeWebTab === 'referral' ? 'text-[#F3D079]' : 'text-gray-400 hover:text-gray-200'
                }`}
              >
                <span className="text-lg">🎁</span>
                <span>REFER</span>
              </button>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* VIEW 4: FULL-SCREEN PLAY JODI / BIDDING MATRIX UI         */}
        {/* (100% Exact Copy of matkagold.com/matka/play/jodi/39)     */}
        {/* ========================================================= */}
        {selectedGameForBetting && (
          <div className="fixed inset-0 bg-[#F1F5F9] text-gray-900 z-50 flex flex-col justify-between overflow-y-auto">
            {/* Top Dark Header */}
            {/* Top Bar Header (100% Copy of Android App UI) */}
            <div className="bg-[#0F172A] border-b border-gray-800/80 px-4 py-3 flex justify-between items-center sticky top-0 z-30 shadow-xl backdrop-blur-md">
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => {
                    setSelectedGameForBetting(null);
                    setBetMessage('');
                  }}
                  className="text-gray-300 hover:text-white"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <h2 className="text-base font-black text-white tracking-wide">
                  {selectedGameForBetting}
                </h2>
              </div>

              {/* Wallet Badge (Dark Gold / Emerald Pill) */}
              <button 
                onClick={() => setShowDepositModal(true)} 
                className="flex items-center gap-1.5 bg-[#152338] border border-amber-500/30 text-[#F3D079] px-3 py-1 rounded-full text-xs font-mono font-bold shadow-md hover:border-amber-400"
              >
                <span>💳 ₹{user?.balance ? user.balance.toFixed(2) : '0.00'}</span>
                <span className="bg-amber-500/20 text-amber-300 text-xs px-1 rounded font-bold">+</span>
              </button>
            </div>

            {/* Sub-header Underline Category Selector (JODI | CROSSING | HAROOF) */}
            <div className="bg-[#0F172A] border-b border-gray-800/60 px-4 py-2 sticky top-[53px] z-20 flex justify-center gap-8 shadow-md">
              {(['Jodi', 'Crossing', 'Haruf'] as const).map((t) => {
                const label = t === 'Haruf' ? 'HAROOF' : t.toUpperCase();
                const isActive = betCategory === t;
                return (
                  <button
                    key={t}
                    onClick={() => {
                      setBetCategory(t);
                      setJodiGrid({});
                    }}
                    className={`text-xs font-black tracking-wider transition-all pb-1.5 ${
                      isActive 
                        ? 'text-amber-400 border-b-2 border-amber-400' 
                        : 'text-gray-400 hover:text-gray-200 border-b-2 border-transparent'
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>

            {/* Main Bidding Cards Area (100% Copy of Android App Dark Theme Grid) */}
            <div className="p-3.5 flex-1 pb-32 max-w-md mx-auto w-full bg-[#0B101D]">
              {betMessage && (
                <div className={`p-3 rounded-xl text-xs font-bold mb-4 text-center ${
                  betMessage.includes('successfully') ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-500/50' : 'bg-red-950/80 text-red-400 border border-red-500/50'
                }`}>
                  {betMessage}
                </div>
              )}

              {/* JODI TAB: 5-Column Grid of 100 Cards (01 - 00) Matching Android App Screenshot! */}
              {betCategory === 'Jodi' && (
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">JODI MATRIX (01 - 00)</span>
                    <button 
                      onClick={() => setJodiGrid({})} 
                      className="text-[11px] text-amber-400 hover:text-amber-300 font-bold underline"
                    >
                      Clear All
                    </button>
                  </div>

                  <div className="grid grid-cols-5 gap-2">
                    {Array.from({ length: 100 }).map((_, idx) => {
                      const numVal = (idx + 1) % 100;
                      const numStr = String(numVal).padStart(2, '0');
                      const val = jodiGrid[numStr] || '';
                      return (
                        <div 
                          key={numStr}
                          className={`rounded-xl border transition-all p-1.5 flex flex-col items-center justify-between min-h-[58px] ${
                            val ? 'bg-emerald-950/60 border-emerald-500/80 shadow-lg shadow-emerald-950/50' : 'bg-[#182234] border-gray-800/90 hover:border-gray-700'
                          }`}
                        >
                          <span className={`text-xs font-mono font-black ${val ? 'text-emerald-400' : 'text-gray-200'}`}>{numStr}</span>
                          <div className="w-full mt-1 flex items-center justify-center bg-[#0F172A] rounded-lg border border-gray-800 px-1 py-0.5">
                            <span className="text-[9px] text-gray-400 font-bold mr-0.5">₹</span>
                            <input
                              type="number"
                              min="1"
                              placeholder=""
                              value={val}
                              onKeyDown={(e) => {
                                if (['-', '+', 'e', 'E', '.'].includes(e.key)) {
                                  e.preventDefault();
                                }
                              }}
                              onChange={(e) => {
                                const cleanVal = e.target.value.replace(/[^0-9]/g, '');
                                if (!cleanVal || parseInt(cleanVal) <= 0) {
                                  const newGrid = { ...jodiGrid };
                                  delete newGrid[numStr];
                                  setJodiGrid(newGrid);
                                } else {
                                  setJodiGrid({ ...jodiGrid, [numStr]: cleanVal });
                                }
                              }}
                              className={`w-full text-center text-[11px] font-mono font-bold focus:outline-none bg-transparent ${val ? 'text-emerald-300' : 'text-white'}`}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* CROSSING TAB: Auto-Generate Combination Pairs */}
              {betCategory === 'Crossing' && (
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">CROSSING MATRIX GENERATOR</span>
                    <button 
                      onClick={() => {
                        setCrossingDigits('');
                        setJodiGrid({});
                      }} 
                      className="text-[11px] text-amber-400 hover:text-amber-300 font-bold underline"
                    >
                      Clear All
                    </button>
                  </div>

                  <div className="bg-[#182234] p-4 rounded-2xl border border-gray-800 space-y-4 mb-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-300 uppercase mb-1.5">Enter Crossing Digits (e.g. 1234)</label>
                      <input
                        type="text"
                        maxLength={10}
                        placeholder="e.g. 123 or 1234"
                        value={crossingDigits}
                        onKeyDown={(e) => {
                          if (['-', '+', 'e', 'E', '.'].includes(e.key)) e.preventDefault();
                        }}
                        onChange={(e) => {
                          const digits = e.target.value.replace(/[^0-9]/g, '');
                          setCrossingDigits(digits);
                          if (digits.length >= 2) {
                            const newGrid: Record<string, string> = {};
                            const amt = crossingAmount || '10';
                            const chars = digits.split('');
                            chars.forEach(d1 => {
                              chars.forEach(d2 => {
                                newGrid[`${d1}${d2}`] = amt;
                              });
                            });
                            setJodiGrid(newGrid);
                          } else {
                            setJodiGrid({});
                          }
                        }}
                        className="w-full bg-[#0F172A] border border-gray-700 rounded-xl p-3 text-sm text-white font-mono focus:outline-none focus:border-[#00C853]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-300 uppercase mb-1.5">Amount Per Pair (₹)</label>
                      <input
                        type="number"
                        min="1"
                        placeholder="Enter amount (min ₹1)"
                        value={crossingAmount}
                        onKeyDown={(e) => {
                          if (['-', '+', 'e', 'E', '.'].includes(e.key)) e.preventDefault();
                        }}
                        onChange={(e) => {
                          const amt = e.target.value.replace(/[^0-9]/g, '');
                          setCrossingAmount(amt);
                          if (crossingDigits.length >= 2 && amt && parseInt(amt) > 0) {
                            const newGrid: Record<string, string> = {};
                            const chars = crossingDigits.split('');
                            chars.forEach(d1 => {
                              chars.forEach(d2 => {
                                newGrid[`${d1}${d2}`] = amt;
                              });
                            });
                            setJodiGrid(newGrid);
                          }
                        }}
                        className="w-full bg-[#0F172A] border border-gray-700 rounded-xl p-3 text-sm text-white font-mono focus:outline-none focus:border-[#00C853]"
                      />
                      <div className="flex gap-2 mt-2">
                        {['10', '50', '100', '500'].map((amt) => (
                          <button
                            type="button"
                            key={amt}
                            onClick={() => {
                              setCrossingAmount(amt);
                              if (crossingDigits.length >= 2) {
                                const newGrid: Record<string, string> = {};
                                const chars = crossingDigits.split('');
                                chars.forEach(d1 => {
                                  chars.forEach(d2 => {
                                    newGrid[`${d1}${d2}`] = amt;
                                  });
                                });
                                setJodiGrid(newGrid);
                              }
                            }}
                            className="flex-1 bg-gray-800 hover:bg-gray-700 text-gray-300 font-bold py-1.5 rounded-lg text-[10px]"
                          >
                            ₹{amt}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Display Generated Pair Cards */}
                  {Object.keys(jodiGrid).length > 0 && (
                    <div>
                      <div className="flex justify-between items-center mb-2 text-xs">
                        <span className="font-bold text-gray-400 uppercase">GENERATED PAIRS ({Object.keys(jodiGrid).length})</span>
                        <span className="font-mono text-emerald-400 font-bold">Total: ₹{Object.values(jodiGrid).reduce((sum, v) => sum + (parseInt(v) || 0), 0)}</span>
                      </div>
                      <div className="grid grid-cols-5 gap-2">
                        {Object.entries(jodiGrid).map(([pair, val]) => (
                          <div 
                            key={pair}
                            className="bg-emerald-950/60 border border-emerald-500/80 rounded-xl p-2 text-center shadow-md flex flex-col items-center justify-between min-h-[58px]"
                          >
                            <span className="text-xs font-mono font-black text-emerald-400">{pair}</span>
                            <span className="text-[10px] font-mono font-bold text-emerald-300">₹{val}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* HARUF TAB: 10 Cards Grid (0 - 9) with Ander / Bahar Sub-tabs */}
              {betCategory === 'Haruf' && (
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">HAROOF NUMBERS (0-9)</span>
                    <button onClick={() => setJodiGrid({})} className="text-[11px] text-amber-400 hover:text-amber-300 font-bold underline">Clear All</button>
                  </div>

                  <div className="bg-[#182234] p-1 rounded-xl border border-gray-800 flex gap-1 mb-4">
                    <button 
                      onClick={() => setHarufSubTab('Ander')}
                      className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                        harufSubTab === 'Ander' ? 'bg-[#00C853] text-white shadow-md' : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      Ander (Inside)
                    </button>
                    <button 
                      onClick={() => setHarufSubTab('Bahar')}
                      className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                        harufSubTab === 'Bahar' ? 'bg-[#00C853] text-white shadow-md' : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      Bahar (Outside)
                    </button>
                  </div>

                  <div className="grid grid-cols-5 gap-2">
                    {Array.from({ length: 10 }).map((_, idx) => {
                      const numStr = String(idx);
                      const val = jodiGrid[numStr] || '';
                      return (
                        <div 
                          key={numStr}
                          className={`rounded-xl border transition-all p-2 flex flex-col items-center justify-between min-h-[64px] ${
                            val ? 'bg-emerald-950/60 border-emerald-500/80 shadow-lg shadow-emerald-950/50' : 'bg-[#182234] border-gray-800/90 hover:border-gray-700'
                          }`}
                        >
                          <span className={`text-xs font-mono font-black ${val ? 'text-emerald-400' : 'text-gray-200'}`}>{numStr}</span>
                          <div className="w-full mt-1 flex items-center justify-center bg-[#0F172A] rounded-lg border border-gray-800 px-1 py-0.5">
                            <span className="text-[9px] text-gray-400 font-bold mr-0.5">₹</span>
                            <input
                              type="number"
                              min="1"
                              placeholder=""
                              value={val}
                              onKeyDown={(e) => {
                                if (['-', '+', 'e', 'E', '.'].includes(e.key)) {
                                  e.preventDefault();
                                }
                              }}
                              onChange={(e) => {
                                const cleanVal = e.target.value.replace(/[^0-9]/g, '');
                                if (!cleanVal || parseInt(cleanVal) <= 0) {
                                  const newGrid = { ...jodiGrid };
                                  delete newGrid[numStr];
                                  setJodiGrid(newGrid);
                                } else {
                                  setJodiGrid({ ...jodiGrid, [numStr]: cleanVal });
                                }
                              }}
                              className={`w-full text-center text-[11px] font-mono font-bold focus:outline-none bg-transparent ${val ? 'text-emerald-300' : 'text-white'}`}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Sticky Dark Action Bar (Matching Android App Dark Theme!) */}
            <div className="fixed bottom-14 left-1/2 -translate-x-1/2 w-full max-w-md bg-[#0F172A] border-t border-gray-800/90 p-3 flex gap-3 items-center z-40 shadow-2xl backdrop-blur-md">
              <button 
                onClick={() => setJodiGrid({})}
                className="bg-red-500/10 border border-red-500/30 text-red-400 font-bold px-3.5 py-3 rounded-xl text-xs flex items-center gap-1 hover:bg-red-500/20"
              >
                <span>🗑️</span> {Object.keys(jodiGrid).length}
              </button>

              <button
                onClick={handlePlaceBet}
                className="flex-1 bg-[#00C853] hover:bg-[#00B248] text-white font-black py-3.5 rounded-xl text-xs uppercase tracking-wider shadow-lg shadow-emerald-900/40 flex items-center justify-center gap-2"
              >
                <span>PLACE BET</span>
                <span>•</span>
                <span className="font-mono">
                  ₹{Object.values(jodiGrid).reduce((sum, val) => sum + (parseFloat(val) || 0), 0)}
                </span>
              </button>
            </div>

            {/* Bottom 5-Icon Navigation Bar (100% Copy of media_1787416911507.png!) */}
            <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-[#0F172A] border-t border-gray-800/90 py-2 px-3 flex justify-around items-center z-50 shadow-2xl backdrop-blur-md">
              <button 
                onClick={() => {
                  setSelectedGameForBetting(null);
                  setActiveWebTab('home');
                }}
                className="flex flex-col items-center gap-1 text-[10px] font-black uppercase tracking-wider text-white transition-all"
              >
                <span className="text-lg">🏠</span>
                <span>HOME</span>
              </button>

              <button 
                onClick={() => {
                  setSelectedGameForBetting(null);
                  setActiveWebTab('charts');
                }}
                className="flex flex-col items-center gap-1 text-[10px] font-black uppercase tracking-wider text-gray-400 hover:text-gray-200 transition-all"
              >
                <span className="text-lg">📊</span>
                <span>CHART</span>
              </button>

              <button 
                onClick={() => {
                  setSelectedGameForBetting(null);
                  setActiveWebTab('mybets');
                }}
                className="flex flex-col items-center gap-1 text-[10px] font-black uppercase tracking-wider text-gray-400 hover:text-gray-200 transition-all"
              >
                <span className="text-lg">🕒</span>
                <span>MY BET</span>
              </button>

              <a 
                href="https://wa.me/917027709695" 
                target="_blank" 
                rel="noreferrer"
                className="flex flex-col items-center gap-1 text-[10px] font-black uppercase tracking-wider text-gray-400 hover:text-gray-200 transition-all"
              >
                <span className="text-lg">🎧</span>
                <span>CHAT</span>
              </a>

              <button 
                onClick={() => setShowReferralModal(true)}
                className="flex flex-col items-center gap-1 text-[10px] font-black uppercase tracking-wider text-[#F3D079] hover:text-white transition-all"
              >
                <span className="text-lg">🔀</span>
                <span>SHARE & EARN</span>
              </button>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* MODAL 2: DEPOSIT MODAL                                   */}
        {/* ========================================================= */}
        {showDepositModal && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-[#1E293B] border border-[#334155] rounded-2xl w-full max-w-sm p-5 shadow-2xl relative">
              <button 
                onClick={() => setShowDepositModal(false)}
                className="absolute top-4 right-4 text-gray-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>

              <h3 className="text-base font-bold text-white mb-1 flex items-center gap-2">
                <span>💳</span> Add Money to Wallet
              </h3>
              <p className="text-xs text-gray-400 mb-4">Pay via UPI & enter UTR reference number.</p>

              {depositMessage && (
                <div className="p-3 bg-green-500/20 border border-green-500/40 text-green-400 rounded-xl text-xs font-bold mb-4 text-center">
                  {depositMessage}
                </div>
              )}

              <form onSubmit={handleDepositSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Amount (₹)</label>
                  <input
                    type="number"
                    value={depositAmount}
                    onChange={(e) => setDepositAmount(e.target.value)}
                    className="w-full bg-[#0F172A] border border-[#334155] rounded-xl p-3 text-sm text-white font-mono focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-2">UTR / Transaction Reference No.</label>
                  <input
                    type="text"
                    placeholder="12-digit UTR No."
                    value={depositUtr}
                    onChange={(e) => setDepositUtr(e.target.value)}
                    className="w-full bg-[#0F172A] border border-[#334155] rounded-xl p-3 text-sm text-white font-mono focus:outline-none"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-[#00C853] text-white font-black py-3.5 rounded-xl uppercase tracking-wider text-xs shadow-lg hover:bg-[#00B248]"
                >
                  SUBMIT DEPOSIT REQUEST ➔
                </button>
              </form>
            </div>
          </div>
        )}

        {/* MODAL: RULES & PAYOUT RATES */}
        {showRulesModal && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <div className="bg-[#121927] border border-gray-800 rounded-3xl p-6 w-full max-w-sm shadow-2xl relative animate-in fade-in zoom-in duration-200">
              <button
                onClick={() => setShowRulesModal(false)}
                className="absolute top-4 right-4 text-gray-400 hover:text-white text-lg font-bold w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center"
              >
                ✕
              </button>

              <div className="text-center mb-5">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#F3D079] to-[#D4AF37] text-slate-950 font-black text-2xl flex items-center justify-center mx-auto mb-2 shadow-lg">
                  📋
                </div>
                <h3 className="text-lg font-extrabold text-white">Rules & Payout Rates</h3>
                <p className="text-xs text-gray-400">Official Game Multipliers & Limits</p>
              </div>

              <div className="space-y-3 text-xs">
                <div className="bg-[#0F172A] p-3 rounded-2xl border border-gray-800 flex justify-between items-center">
                  <div>
                    <h4 className="font-bold text-white">Single Jodi (00-99)</h4>
                    <p className="text-[10px] text-gray-400">₹100 bet pays ₹9,500</p>
                  </div>
                  <span className="px-2.5 py-1 bg-[#00C853]/20 border border-[#00C853]/50 text-[#00C853] font-black rounded-xl">95X</span>
                </div>

                <div className="bg-[#0F172A] p-3 rounded-2xl border border-gray-800 flex justify-between items-center">
                  <div>
                    <h4 className="font-bold text-white">Crossing Matrix</h4>
                    <p className="text-[10px] text-gray-400">All combination pairs</p>
                  </div>
                  <span className="px-2.5 py-1 bg-[#00C853]/20 border border-[#00C853]/50 text-[#00C853] font-black rounded-xl">95X</span>
                </div>

                <div className="bg-[#0F172A] p-3 rounded-2xl border border-gray-800 flex justify-between items-center">
                  <div>
                    <h4 className="font-bold text-white">Haruf Ander (Inside)</h4>
                    <p className="text-[10px] text-gray-400">₹100 bet pays ₹950</p>
                  </div>
                  <span className="px-2.5 py-1 bg-yellow-500/20 border border-yellow-500/50 text-[#F3D079] font-black rounded-xl">9.5X</span>
                </div>

                <div className="bg-[#0F172A] p-3 rounded-2xl border border-gray-800 flex justify-between items-center">
                  <div>
                    <h4 className="font-bold text-white">Haruf Bahar (Outside)</h4>
                    <p className="text-[10px] text-gray-400">₹100 bet pays ₹950</p>
                  </div>
                  <span className="px-2.5 py-1 bg-yellow-500/20 border border-yellow-500/50 text-[#F3D079] font-black rounded-xl">9.5X</span>
                </div>

                <div className="bg-[#0F172A] p-3 rounded-2xl border border-gray-800 text-[11px] space-y-1 text-gray-300">
                  <p>⚡ <strong className="text-white">Min Deposit:</strong> ₹100</p>
                  <p>🏦 <strong className="text-white">Min Withdrawal:</strong> ₹500</p>
                  <p>🎲 <strong className="text-white">Min Bet:</strong> ₹10</p>
                </div>
              </div>

              <button
                onClick={() => setShowRulesModal(false)}
                className="w-full mt-5 bg-[#00C853] hover:bg-[#00B248] text-white font-bold py-3 rounded-xl uppercase tracking-wider text-xs shadow-lg"
              >
                GOT IT ➔
              </button>
            </div>
          </div>
        )}

        {/* MODAL: USER PROFILE */}
        {showProfileModal && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <div className="bg-[#121927] border border-gray-800 rounded-3xl p-6 w-full max-w-sm shadow-2xl relative animate-in fade-in zoom-in duration-200">
              <button
                onClick={() => setShowProfileModal(false)}
                className="absolute top-4 right-4 text-gray-400 hover:text-white text-lg font-bold w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center"
              >
                ✕
              </button>

              <div className="text-center mb-5">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#00C853] to-[#00897B] text-white text-3xl font-black flex items-center justify-center mx-auto mb-3 shadow-lg border-2 border-emerald-400/40">
                  👑
                </div>
                <h3 className="text-lg font-black text-white">{user?.name || 'Player'}</h3>
                <p className="text-xs text-gray-400 font-mono mt-0.5">+91 {user?.mobile || '9999999999'}</p>
                <span className="inline-block mt-2 px-3 py-0.5 bg-emerald-950 border border-emerald-500/50 text-[#00C853] font-bold text-[10px] uppercase rounded-full">
                  Account Active 🟢
                </span>
              </div>

              <div className="space-y-3 mb-5">
                <div className="bg-[#0F172A] p-4 rounded-2xl border border-gray-800 flex justify-between items-center">
                  <div>
                    <p className="text-[10px] text-gray-400 uppercase tracking-wider font-bold">Wallet Balance</p>
                    <h4 className="text-lg font-black font-mono text-[#00C853]">₹{user?.balance ? user.balance.toFixed(2) : '0.00'}</h4>
                  </div>
                  <button
                    onClick={() => {
                      setShowProfileModal(false);
                      setShowDepositModal(true);
                    }}
                    className="px-3 py-2 bg-[#00C853] text-white font-bold text-xs rounded-xl hover:bg-[#00B248] shadow-md"
                  >
                    + Add Cash
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => {
                    setShowProfileModal(false);
                    setShowWithdrawModal(true);
                  }}
                  className="bg-gray-800 hover:bg-gray-700 text-white font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5"
                >
                  🏦 Withdraw
                </button>
                <button
                  onClick={() => {
                    setShowProfileModal(false);
                    setActiveWebTab('mybets');
                  }}
                  className="bg-gray-800 hover:bg-gray-700 text-white font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5"
                >
                  📜 My Bets
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL: WITHDRAW CASH */}
        {showWithdrawModal && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <div className="bg-[#121927] border border-gray-800 rounded-3xl p-6 w-full max-w-sm shadow-2xl relative animate-in fade-in zoom-in duration-200">
              <button
                onClick={() => setShowWithdrawModal(false)}
                className="absolute top-4 right-4 text-gray-400 hover:text-white text-lg font-bold w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center"
              >
                ✕
              </button>

              <div className="text-center mb-5">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#F3D079] to-[#D4AF37] text-slate-950 font-black text-2xl flex items-center justify-center mx-auto mb-2 shadow-lg">
                  🏦
                </div>
                <h3 className="text-lg font-extrabold text-white">Withdraw Cash</h3>
                <p className="text-xs text-gray-400 mt-0.5">24x7 Direct Bank & UPI Settlement</p>
              </div>

              {/* Wallet Balance Info */}
              <div className="bg-[#0F172A] p-3.5 rounded-2xl border border-gray-800 flex justify-between items-center mb-4">
                <div>
                  <p className="text-[10px] text-gray-400 uppercase font-bold">Available Balance</p>
                  <h4 className="text-base font-black font-mono text-[#00C853]">₹{user?.balance ? user.balance.toFixed(2) : '0.00'}</h4>
                </div>
                <span className="text-[10px] bg-yellow-500/10 border border-yellow-500/30 text-[#F3D079] px-2.5 py-1 rounded-full font-bold">
                  Min: ₹500
                </span>
              </div>

              {withdrawMessage && (
                <div className={`p-3 rounded-xl text-xs font-bold mb-4 text-center ${withdrawMessage.includes('Error') ? 'bg-red-500/20 border border-red-500/40 text-red-400' : 'bg-green-500/20 border border-green-500/40 text-green-400'}`}>
                  {withdrawMessage}
                </div>
              )}

              <form onSubmit={handleWithdrawSubmit} className="space-y-4 text-xs">
                {/* Method Switcher Pills */}
                <div className="grid grid-cols-2 gap-2 bg-[#0F172A] p-1 rounded-xl border border-gray-800">
                  <button
                    type="button"
                    onClick={() => setWithdrawMethod('UPI')}
                    className={`py-2 rounded-lg font-bold transition-all text-center ${withdrawMethod === 'UPI' ? 'bg-[#00C853] text-white shadow-md' : 'text-gray-400 hover:text-white'}`}
                  >
                    ⚡ UPI ID
                  </button>
                  <button
                    type="button"
                    onClick={() => setWithdrawMethod('Bank')}
                    className={`py-2 rounded-lg font-bold transition-all text-center ${withdrawMethod === 'Bank' ? 'bg-[#00C853] text-white shadow-md' : 'text-gray-400 hover:text-white'}`}
                  >
                    🏦 Bank Transfer
                  </button>
                </div>

                {/* Amount Input */}
                <div>
                  <label className="block text-[11px] font-bold text-gray-400 uppercase mb-1">Amount (Min ₹500)</label>
                  <input
                    type="number"
                    min="500"
                    placeholder="Enter amount (e.g. 500)"
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                    className="w-full bg-[#0F172A] border border-gray-700 rounded-xl p-3 text-sm text-white font-mono focus:outline-none focus:border-[#00C853]"
                  />
                  <div className="flex gap-2 mt-2">
                    {['500', '1000', '2000', '5000'].map((amt) => (
                      <button
                        type="button"
                        key={amt}
                        onClick={() => setWithdrawAmount(amt)}
                        className="flex-1 bg-gray-800 hover:bg-gray-700 text-gray-300 font-bold py-1.5 rounded-lg text-[10px]"
                      >
                        ₹{amt}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Account Holder Name */}
                <div>
                  <label className="block text-[11px] font-bold text-gray-400 uppercase mb-1">Account Holder Name</label>
                  <input
                    type="text"
                    placeholder="Full name as per Bank / UPI"
                    value={withdrawHolderName}
                    onChange={(e) => setWithdrawHolderName(e.target.value)}
                    className="w-full bg-[#0F172A] border border-gray-700 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-[#00C853]"
                  />
                </div>

                {/* Dynamic Payment Inputs */}
                {withdrawMethod === 'UPI' ? (
                  <div>
                    <label className="block text-[11px] font-bold text-gray-400 uppercase mb-1">UPI ID (VPA)</label>
                    <input
                      type="text"
                      placeholder="e.g. 9999999999@ybl / name@paytm"
                      value={withdrawUpi}
                      onChange={(e) => setWithdrawUpi(e.target.value)}
                      className="w-full bg-[#0F172A] border border-gray-700 rounded-xl p-3 text-xs text-white font-mono focus:outline-none focus:border-[#00C853]"
                    />
                  </div>
                ) : (
                  <>
                    <div>
                      <label className="block text-[11px] font-bold text-gray-400 uppercase mb-1">Bank Account Number</label>
                      <input
                        type="text"
                        placeholder="Enter 9-18 digit account number"
                        value={withdrawBankAcc}
                        onChange={(e) => setWithdrawBankAcc(e.target.value)}
                        className="w-full bg-[#0F172A] border border-gray-700 rounded-xl p-3 text-xs text-white font-mono focus:outline-none focus:border-[#00C853]"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-gray-400 uppercase mb-1">IFSC Code</label>
                      <input
                        type="text"
                        placeholder="e.g. SBIN0001234"
                        value={withdrawBankIfsc}
                        onChange={(e) => setWithdrawBankIfsc(e.target.value.toUpperCase())}
                        className="w-full bg-[#0F172A] border border-gray-700 rounded-xl p-3 text-xs text-white font-mono uppercase focus:outline-none focus:border-[#00C853]"
                      />
                    </div>
                  </>
                )}

                <button
                  type="submit"
                  disabled={isWithdrawSubmitting}
                  className="w-full bg-[#00C853] hover:bg-[#00B248] disabled:bg-gray-700 text-white font-black py-3.5 rounded-xl uppercase tracking-wider text-xs shadow-lg transition-all"
                >
                  {isWithdrawSubmitting ? 'PROCESSING...' : 'REQUEST WITHDRAWAL ➔'}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* MODAL 4: REFERRAL PAGE (DARK LUXURY MATKA THEME)         */}
        {/* ========================================================= */}
        {showReferralModal && (
          <div className="fixed inset-0 bg-[#0F172A] z-50 overflow-y-auto flex flex-col justify-between">
            {/* Top Dark Header */}
            <div className="bg-[#1E293B] px-4 py-3 border-b border-[#334155] flex justify-between items-center sticky top-0 z-30 shadow-md">
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => setShowReferralModal(false)}
                  className="text-white text-2xl font-bold hover:text-[#F3D079]"
                >
                  ✕
                </button>
                <div>
                  <h1 className="text-lg font-black text-[#F3D079] tracking-wide leading-tight">Referral</h1>
                  <p className="text-[10px] font-semibold text-[#94A3B8]">Play Smart • Play Safe • Win Big</p>
                </div>
              </div>

              {/* Balance Badge */}
              <button 
                onClick={() => {
                  setShowReferralModal(false);
                  setShowDepositModal(true);
                }}
                className="bg-[#00C853] hover:bg-[#00B248] text-white px-3 py-1.5 rounded-full flex items-center gap-2 text-xs font-mono font-black shadow-md transition-all"
              >
                <span className="w-2 h-2 rounded-full bg-white animate-pulse"></span>
                <span>₹{(user?.balance || 3520).toFixed(2)}</span>
                <span className="w-5 h-5 rounded-full bg-white text-[#00C853] flex items-center justify-center font-bold text-sm">+</span>
              </button>
            </div>

            {/* Main Content Area */}
            <div className="p-4 flex-1 max-w-md mx-auto w-full space-y-4 text-white pb-28">
              {/* CARD 1: TOTAL COMMISSION */}
              <div className="bg-[#1E293B] rounded-2xl shadow-lg border border-[#334155] overflow-hidden">
                <div className="bg-[#162238] px-4 py-2.5 flex justify-between items-center text-white">
                  <div className="flex items-center gap-2">
                    <span className="text-sm">🎟️</span>
                    <span className="text-xs font-black tracking-wider uppercase">TOTAL COMMISSION</span>
                  </div>
                  <button 
                    onClick={fetchWebsiteReferralDetails}
                    className="text-xs hover:rotate-180 transition-transform p-1"
                  >
                    🔄
                  </button>
                </div>
                <div className="p-4">
                  <div className="bg-[#0F172A] border-2 border-[#F3D079] rounded-2xl py-4 text-center">
                    <span className="text-2xl font-mono font-black text-[#F3D079]">
                      ₹{referralDetails.totalCommission || 0}/-
                    </span>
                  </div>
                </div>
              </div>

              {/* CARD 2: YOUR REFERRAL CODE */}
              <div className="bg-[#1E293B] rounded-2xl shadow-lg border border-[#334155] overflow-hidden">
                <div className="bg-[#00873E] px-4 py-2.5 flex items-center gap-2 text-white">
                  <span className="text-sm">🎁</span>
                  <span className="text-xs font-black tracking-wider uppercase">YOUR REFERRAL CODE</span>
                </div>
                <div className="p-4 text-center">
                  {(() => {
                    const userRefCode = referralDetails.referral_code || user?.referral_code || (user?.mobile ? `REF${user.mobile.slice(-10)}` : 'REF1472580369');
                    const shareText = `Play 95X Matka & Win 95X! 👑\nUse my Referral Code: ${userRefCode} to get bonus balance!\nPlay online: https://matka-website.vercel.app`;
                    const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`;

                    return (
                      <div className="space-y-4">
                        <div className="bg-[#0F172A] border-2 border-[#F3D079] rounded-2xl py-3.5 px-3">
                          <div className="text-xl font-mono font-black text-[#F3D079] tracking-[0.2em] select-all whitespace-nowrap overflow-x-auto">
                            {userRefCode}
                          </div>
                        </div>

                        <div className="text-xs font-semibold text-[#94A3B8]">
                          https://matka-website.vercel.app/
                        </div>

                        {/* Side-by-Side Action Buttons */}
                        <div className="grid grid-cols-2 gap-3">
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(shareText);
                              setCopiedToast(true);
                              setTimeout(() => setCopiedToast(false), 2500);
                            }}
                            className="bg-[#00873E] hover:bg-[#007033] text-white font-bold py-2.5 px-3 rounded-xl flex justify-center items-center gap-2 text-xs uppercase tracking-wider shadow-sm transition-all"
                          >
                            <span>📋</span>
                            <span>{copiedToast ? 'COPIED!' : 'Copy Code'}</span>
                          </button>

                          <a
                            href={whatsappUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="bg-[#F59E0B] hover:bg-[#D97706] text-[#0F172A] font-black py-2.5 px-3 rounded-xl flex justify-center items-center gap-2 text-xs uppercase tracking-wider shadow-sm transition-all"
                          >
                            <span>🔀</span>
                            <span>Share</span>
                          </a>
                        </div>

                        {/* Step Process Indicator */}
                        <div className="grid grid-cols-3 gap-2 pt-3 border-t border-[#334155]">
                          <div className="flex flex-col items-center">
                            <div className="w-7 h-7 rounded-full bg-[#0F172A] border border-[#F3D079] flex items-center justify-center font-black text-xs text-[#F3D079] mb-1">1</div>
                            <span className="text-[10px] font-medium text-[#94A3B8]">Share your code</span>
                          </div>
                          <div className="flex flex-col items-center">
                            <div className="w-7 h-7 rounded-full bg-[#0F172A] border border-[#F3D079] flex items-center justify-center font-black text-xs text-[#F3D079] mb-1">2</div>
                            <span className="text-[10px] font-medium text-[#94A3B8]">They sign up</span>
                          </div>
                          <div className="flex flex-col items-center">
                            <div className="w-7 h-7 rounded-full bg-[#0F172A] border border-[#F3D079] flex items-center justify-center font-black text-xs text-[#F3D079] mb-1">3</div>
                            <span className="text-[10px] font-medium text-[#94A3B8]">You earn</span>
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>

              {/* CARD 3: TOTAL REFERRALS */}
              <div className="bg-[#1E293B] rounded-2xl shadow-lg border border-[#334155] overflow-hidden">
                <div className="bg-[#162238] px-4 py-2.5 flex justify-between items-center text-white">
                  <div className="flex items-center gap-2">
                    <span className="text-sm">👥</span>
                    <span className="text-xs font-black tracking-wider uppercase">TOTAL REFERRALS</span>
                  </div>
                  <div className="bg-[#0F172A] border border-[#F3D079] text-[#F3D079] px-2.5 py-0.5 rounded-full text-xs font-black flex items-center gap-1">
                    <span>👤</span>
                    <span>{referralDetails.referralsCount || 0}</span>
                  </div>
                </div>

                <div className="p-4 text-center">
                  {referralDetails.referredUsers.length === 0 ? (
                    <div className="py-4">
                      <div className="text-4xl mb-2">👥</div>
                      <p className="text-sm font-bold text-[#94A3B8]">No referrals yet</p>
                      <p className="text-[11px] text-[#64748B] mt-1">Share your code above to start earning bonus & lifetime 4% bet commissions!</p>
                    </div>
                  ) : (
                    <div className="text-left space-y-2.5">
                      {referralDetails.referredUsers.map((ref, idx) => (
                        <div key={idx} className="p-3.5 bg-[#0F172A] rounded-xl border border-[#334155] flex justify-between items-center text-xs">
                          <div>
                            <p className="font-bold text-white text-sm">{ref.name}</p>
                            <p className="text-[#94A3B8] font-mono text-[11px] mt-0.5">{ref.mobile} • {ref.date}</p>
                            <p className="text-[11px] text-[#F3D079] font-semibold mt-1">
                              Bonus: ₹{ref.bonus} • 4% Bet Comm: ₹{ref.betCommission.toFixed(2)}
                            </p>
                          </div>
                          <div className="text-right">
                            <span className="font-mono font-black text-[#00C853] text-base">+₹{ref.totalEarned.toFixed(2)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
