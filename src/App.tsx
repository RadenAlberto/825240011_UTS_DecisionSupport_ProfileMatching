import React, { useState, useMemo } from 'react';
import {
  Users,
  Award,
  Plus,
  RotateCcw,
  Trash2,
  Edit2,
  Check,
  ChevronRight,
  Calculator,
  Download,
  Eye,
  Settings,
  HelpCircle,
  TrendingUp,
  Sliders,
  AlertCircle,
  Briefcase,
  Layers,
  X
} from 'lucide-react';

// ==========================================
// TYPE DEFINITIONS
// ==========================================

interface Scores {
  kedisiplinan: number;      // SK, CF, Target 4
  kejujuran: number;         // SK, CF, Target 5
  kerjasama: number;         // SK, SF, Target 4
  tanggungJawab: number;     // KP, CF, Target 5
  inisiatif: number;         // KP, SF, Target 4
  adaptasi: number;          // KP, SF, Target 4
  pencapaianTarget: number;  // TJ, CF, Target 5
  ketelitian: number;        // TJ, SF, Target 4
}

interface Candidate {
  id: string;
  name: string;
  role: string;
  department: string;
  scores: Scores;
}

interface CalculationResult {
  candidateId: string;
  gaps: { [K in keyof Scores]: number };
  weights: { [K in keyof Scores]: number };
  sikapKerja: {
    ncf: number;
    nsf: number;
    total: number;
  };
  kepribadian: {
    ncf: number;
    nsf: number;
    total: number;
  };
  tanggungJawab: {
    ncf: number;
    nsf: number;
    total: number;
  };
  finalScore: number;
}

// ==========================================
// STATIC CONSTANTS & DEFAULT DATA
// ==========================================

const DEFAULT_STANDARDS: Scores = {
  kedisiplinan: 4,
  kejujuran: 5,
  kerjasama: 4,
  tanggungJawab: 5,
  inisiatif: 4,
  adaptasi: 4,
  pencapaianTarget: 5,
  ketelitian: 4
};

const ASPECT_INFO = {
  sikapKerja: {
    name: 'Sikap Kerja',
    weight: 0.35,
    criteria: [
      { key: 'kedisiplinan', label: 'Kedisiplinan', type: 'Core Factor (CF)' },
      { key: 'kejujuran', label: 'Kejujuran', type: 'Core Factor (CF)' },
      { key: 'kerjasama', label: 'Kerjasama', type: 'Secondary Factor (SF)' }
    ] as { key: keyof Scores; label: string; type: 'Core Factor (CF)' | 'Secondary Factor (SF)' }[]
  },
  kepribadian: {
    name: 'Kepribadian',
    weight: 0.30,
    criteria: [
      { key: 'tanggungJawab', label: 'Tanggung Jawab', type: 'Core Factor (CF)' },
      { key: 'inisiatif', label: 'Inisiatif', type: 'Secondary Factor (SF)' },
      { key: 'adaptasi', label: 'Adaptasi', type: 'Secondary Factor (SF)' }
    ] as { key: keyof Scores; label: string; type: 'Core Factor (CF)' | 'Secondary Factor (SF)' }[]
  },
  tanggungJawab: {
    name: 'Tanggung Jawab',
    weight: 0.35,
    criteria: [
      { key: 'pencapaianTarget', label: 'Pencapaian Target', type: 'Core Factor (CF)' },
      { key: 'ketelitian', label: 'Ketelitian', type: 'Secondary Factor (SF)' }
    ] as { key: keyof Scores; label: string; type: 'Core Factor (CF)' | 'Secondary Factor (SF)' }[]
  }
};

const INITIAL_CANDIDATES: Candidate[] = [
  {
    id: 'c-1',
    name: 'Andi Saputra',
    role: 'Staff Produksi',
    department: 'Produksi A',
    scores: {
      kedisiplinan: 4,
      kejujuran: 5,
      kerjasama: 4,
      tanggungJawab: 5,
      inisiatif: 4,
      adaptasi: 4,
      pencapaianTarget: 5,
      ketelitian: 4
    }
  },
  {
    id: 'c-2',
    name: 'Budi Hermawan',
    role: 'Operator Mesin',
    department: 'Produksi B',
    scores: {
      kedisiplinan: 5,
      kejujuran: 4,
      kerjasama: 5,
      tanggungJawab: 4,
      inisiatif: 4,
      adaptasi: 5,
      pencapaianTarget: 4,
      ketelitian: 3
    }
  },
  {
    id: 'c-3',
    name: 'Citra Lestari',
    role: 'Admin Inventory',
    department: 'Logistik',
    scores: {
      kedisiplinan: 5,
      kejujuran: 5,
      kerjasama: 4,
      tanggungJawab: 5,
      inisiatif: 5,
      adaptasi: 4,
      pencapaianTarget: 5,
      ketelitian: 5
    }
  },
  {
    id: 'c-4',
    name: 'Dewi Sartika',
    role: 'Staff QC',
    department: 'Quality Control',
    scores: {
      kedisiplinan: 3,
      kejujuran: 4,
      kerjasama: 4,
      tanggungJawab: 4,
      inisiatif: 3,
      adaptasi: 4,
      pencapaianTarget: 3,
      ketelitian: 4
    }
  },
  {
    id: 'c-5',
    name: 'Eko Prasetyo',
    role: 'Operator Moulding',
    department: 'Produksi A',
    scores: {
      kedisiplinan: 4,
      kejujuran: 5,
      kerjasama: 3,
      tanggungJawab: 5,
      inisiatif: 4,
      adaptasi: 3,
      pencapaianTarget: 5,
      ketelitian: 4
    }
  },
  {
    id: 'c-6',
    name: 'Fitri Handayani',
    role: 'Leader QC',
    department: 'Quality Control',
    scores: {
      kedisiplinan: 5,
      kejujuran: 4,
      kerjasama: 4,
      tanggungJawab: 5,
      inisiatif: 5,
      adaptasi: 5,
      pencapaianTarget: 4,
      ketelitian: 4
    }
  }
];

// Map Gap to Weighted Scores
const getGapWeight = (gap: number): number => {
  switch (gap) {
    case 0: return 3.0;
    case 1: return 3.5;
    case -1: return 2.5;
    case 2: return 4.0;
    case -2: return 2.0;
    case 3: return 4.5;
    case -3: return 1.5;
    case 4: return 5.0;
    case -4: return 1.0;
    default:
      if (gap > 4) return 5.0;
      if (gap < -4) return 1.0;
      return 3.0;
  }
};

export default function App() {
  // ==========================================
  // STATE MANAGEMENT
  // ==========================================
  const [candidates, setCandidates] = useState<Candidate[]>(INITIAL_CANDIDATES);
  const [standards, setStandards] = useState<Scores>(DEFAULT_STANDARDS);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'candidates' | 'calculations' | 'rankings'>('dashboard');
  const [selectedCandidateId, setSelectedCandidateId] = useState<string>(INITIAL_CANDIDATES[2].id); // Default to Citra Lestari
  const [isAddingCandidate, setIsAddingCandidate] = useState<boolean>(false);
  const [editingCandidate, setEditingCandidate] = useState<Candidate | null>(null);

  // Form State
  const [formName, setFormName] = useState('');
  const [formRole, setFormRole] = useState('');
  const [formDepartment, setFormDepartment] = useState('');
  const [formScores, setFormScores] = useState<Scores>({
    kedisiplinan: 3,
    kejujuran: 3,
    kerjasama: 3,
    tanggungJawab: 3,
    inisiatif: 3,
    adaptasi: 3,
    pencapaianTarget: 3,
    ketelitian: 3
  });

  // Settings Panel State
  const [showSettings, setShowSettings] = useState<boolean>(false);
  const [tempStandards, setTempStandards] = useState<Scores>(DEFAULT_STANDARDS);

  // Search / Filter
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDept, setFilterDept] = useState('All');

  // ==========================================
  // METHOD: CALCULATE PROFILE MATCHING
  // ==========================================
  const calculationResults = useMemo<CalculationResult[]>(() => {
    return candidates.map((candidate) => {
      const gaps = {} as { [K in keyof Scores]: number };
      const weights = {} as { [K in keyof Scores]: number };

      // 1. Calculate Gaps and Converted Weights
      (Object.keys(standards) as Array<keyof Scores>).forEach((key) => {
        const value = candidate.scores[key];
        const target = standards[key];
        const gap = value - target;
        gaps[key] = gap;
        weights[key] = getGapWeight(gap);
      });

      // Helper to compute factor score (NCF / NSF)
      const computeFactorScore = (criteriaKeys: (keyof Scores)[]) => {
        if (criteriaKeys.length === 0) return 0;
        const sum = criteriaKeys.reduce((acc, key) => acc + weights[key], 0);
        return sum / criteriaKeys.length;
      };

      // 2. Aspect 1: Sikap Kerja (Bobot 35%)
      // - CF: Kedisiplinan, Kejujuran
      // - SF: Kerjasama
      const skCFKeys: (keyof Scores)[] = ['kedisiplinan', 'kejujuran'];
      const skSFKeys: (keyof Scores)[] = ['kerjasama'];
      const skNCF = computeFactorScore(skCFKeys);
      const skNSF = computeFactorScore(skSFKeys);
      const skTotal = (0.6 * skNCF) + (0.4 * skNSF);

      // 3. Aspect 2: Kepribadian (Bobot 30%)
      // - CF: Tanggung Jawab
      // - SF: Inisiatif, Adaptasi
      const kpCFKeys: (keyof Scores)[] = ['tanggungJawab'];
      const kpSFKeys: (keyof Scores)[] = ['inisiatif', 'adaptasi'];
      const kpNCF = computeFactorScore(kpCFKeys);
      const kpNSF = computeFactorScore(kpSFKeys);
      const kpTotal = (0.6 * kpNCF) + (0.4 * kpNSF);

      // 4. Aspect 3: Tanggung Jawab (Bobot 35%)
      // - CF: Pencapaian Target
      // - SF: Ketelitian
      const tjCFKeys: (keyof Scores)[] = ['pencapaianTarget'];
      const tjSFKeys: (keyof Scores)[] = ['ketelitian'];
      const tjNCF = computeFactorScore(tjCFKeys);
      const tjNSF = computeFactorScore(tjSFKeys);
      const tjTotal = (0.6 * tjNCF) + (0.4 * tjNSF);

      // 5. Final Ranking Score
      // Sikap Kerja (35%), Kepribadian (30%), Tanggung Jawab (35%)
      const finalScore = (0.35 * skTotal) + (0.30 * kpTotal) + (0.35 * tjTotal);

      return {
        candidateId: candidate.id,
        gaps,
        weights,
        sikapKerja: { ncf: skNCF, nsf: skNSF, total: skTotal },
        kepribadian: { ncf: kpNCF, nsf: kpNSF, total: kpTotal },
        tanggungJawab: { ncf: tjNCF, nsf: tjNSF, total: tjTotal },
        finalScore
      };
    });
  }, [candidates, standards]);

  // Combined data sorted for ranks
  const rankedCandidates = useMemo(() => {
    const resultsMap = new Map<string, CalculationResult>();
    calculationResults.forEach((r) => resultsMap.set(r.candidateId, r));

    return candidates
      .map((c) => {
        const result = resultsMap.get(c.id)!;
        return {
          ...c,
          calculations: result,
          finalScore: result.finalScore
        };
      })
      .sort((a, b) => b.finalScore - a.finalScore);
  }, [candidates, calculationResults]);

  // Departments list for filters
  const departments = useMemo(() => {
    const depts = new Set<string>();
    candidates.forEach((c) => depts.add(c.department));
    return ['All', ...Array.from(depts)];
  }, [candidates]);

  // Selected candidate's calculations reference
  const selectedResult = useMemo(() => {
    return calculationResults.find((r) => r.candidateId === selectedCandidateId) || calculationResults[0];
  }, [calculationResults, selectedCandidateId]);

  const selectedCandidate = useMemo(() => {
    return candidates.find((c) => c.id === selectedCandidateId) || candidates[0];
  }, [candidates, selectedCandidateId]);

  // Stats
  const stats = useMemo(() => {
    const total = candidates.length;
    const topCand = rankedCandidates[0];
    const avgScore = total > 0 ? calculationResults.reduce((acc, c) => acc + c.finalScore, 0) / total : 0;
    const countRecommended = calculationResults.filter((r) => r.finalScore >= 3.5).length;

    return { total, topCand, avgScore, countRecommended };
  }, [candidates, rankedCandidates, calculationResults]);

  // ==========================================
  // HANDLERS
  // ==========================================

  // Load preset form data for editing
  const handleEditClick = (candidate: Candidate) => {
    setEditingCandidate(candidate);
    setFormName(candidate.name);
    setFormRole(candidate.role);
    setFormDepartment(candidate.department);
    setFormScores({ ...candidate.scores });
    setIsAddingCandidate(true); // Share the same form view
  };

  // Handle Create / Update Submit
  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formRole.trim() || !formDepartment.trim()) {
      alert('Mohon lengkapi seluruh field identitas karyawan.');
      return;
    }

    if (editingCandidate) {
      // Update
      setCandidates((prev) =>
        prev.map((c) =>
          c.id === editingCandidate.id
            ? { ...c, name: formName, role: formRole, department: formDepartment, scores: formScores }
            : c
        )
      );
    } else {
      // Create new
      const newCand: Candidate = {
        id: `c-${Date.now()}`,
        name: formName,
        role: formRole,
        department: formDepartment,
        scores: formScores
      };
      setCandidates((prev) => [...prev, newCand]);
      setSelectedCandidateId(newCand.id);
    }

    // Reset Form
    setIsAddingCandidate(false);
    setEditingCandidate(null);
    setFormName('');
    setFormRole('');
    setFormDepartment('');
    setFormScores({
      kedisiplinan: 3,
      kejujuran: 3,
      kerjasama: 3,
      tanggungJawab: 3,
      inisiatif: 3,
      adaptasi: 3,
      pencapaianTarget: 3,
      ketelitian: 3
    });
  };

  const handleDeleteCandidate = (id: string) => {
    if (confirm('Apakah Anda yakin ingin menghapus data karyawan ini?')) {
      const updated = candidates.filter((c) => c.id !== id);
      setCandidates(updated);
      if (selectedCandidateId === id && updated.length > 0) {
        setSelectedCandidateId(updated[0].id);
      }
    }
  };

  const handleResetData = () => {
    if (confirm('Kembalikan semua data karyawan dan target standar ke default pabrik PT Jaya Prima Plastik?')) {
      setCandidates(INITIAL_CANDIDATES);
      setStandards(DEFAULT_STANDARDS);
      setSelectedCandidateId(INITIAL_CANDIDATES[2].id);
      setSearchTerm('');
      setFilterDept('All');
    }
  };

  const handleSaveStandards = () => {
    setStandards(tempStandards);
    setShowSettings(false);
  };

  const handleOpenSettings = () => {
    setTempStandards({ ...standards });
    setShowSettings(true);
  };

  const triggerAddView = () => {
    setEditingCandidate(null);
    setFormName('');
    setFormRole('');
    setFormDepartment('');
    setFormScores({
      kedisiplinan: 4,
      kejujuran: 4,
      kerjasama: 4,
      tanggungJawab: 4,
      inisiatif: 4,
      adaptasi: 4,
      pencapaianTarget: 4,
      ketelitian: 4
    });
    setIsAddingCandidate(true);
  };

  // Simulated export to printable view/text
  const exportSummaryData = () => {
    let output = `PT JAYA PRIMA PLASTIK\n`;
    output += `SISTEM PENDUKUNG KEPUTUSAN (SPK) - HASIL EVALUASI PROFILE MATCHING\n`;
    output += `Tanggal: ${new Date().toLocaleDateString('id-ID')}\n`;
    output += `========================================================================\n\n`;
    output += `DAFTAR STANDAR TARGET JABATAN:\n`;
    (Object.keys(standards) as Array<keyof Scores>).forEach((k) => {
      output += `- ${k.toUpperCase()}: ${standards[k]}\n`;
    });
    output += `\n========================================================================\n\n`;
    output += `PERINGKAT KARYAWAN:\n`;
    rankedCandidates.forEach((cand, idx) => {
      output += `${idx + 1}. ${cand.name} (${cand.role} - ${cand.department})\n`;
      output += `   Skor Akhir: ${cand.finalScore.toFixed(3)}\n`;
      output += `   Sikap Kerja: ${cand.calculations.sikapKerja.total.toFixed(2)}\n`;
      output += `   Kepribadian: ${cand.calculations.kepribadian.total.toFixed(2)}\n`;
      output += `   Tanggung Jawab: ${cand.calculations.tanggungJawab.total.toFixed(2)}\n`;
      output += `   Rekomendasi: ${cand.finalScore >= 3.8 ? 'Promosi Utama' : cand.finalScore >= 3.2 ? 'Promosi Cadangan' : 'Pertahankan Posisi'}\n\n`;
    });

    const element = document.createElement('a');
    const file = new Blob([output], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `Laporan_SPK_ProfileMatching_PT_JayaPrimaPlastik_${Date.now()}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  // Helper score badges coloring
  const getScoreColorClass = (score: number) => {
    if (score >= 4.5) return 'text-emerald-700 bg-emerald-50 border border-emerald-100';
    if (score >= 3.5) return 'text-blue-700 bg-blue-50 border border-blue-100';
    if (score >= 2.5) return 'text-amber-700 bg-amber-50 border border-amber-100';
    return 'text-rose-700 bg-rose-50 border border-rose-100';
  };

  const getGapColorClass = (gap: number) => {
    if (gap === 0) return 'text-emerald-600 bg-emerald-50 font-semibold';
    if (gap > 0) return 'text-blue-600 bg-blue-50';
    return 'text-rose-600 bg-rose-50';
  };

  const getRecommendationBadge = (score: number) => {
    if (score >= 3.8) {
      return {
        text: 'PROMOSI UTAMA',
        bg: 'bg-emerald-100 text-emerald-800 border-emerald-200',
        desc: 'Sangat direkomendasikan untuk promosi jabatan segera.'
      };
    } else if (score >= 3.2) {
      return {
        text: 'PROMOSI CADANGAN',
        bg: 'bg-blue-100 text-blue-800 border-blue-200',
        desc: 'Direkomendasikan untuk pembinaan lanjutan atau promosi gelombang berikutnya.'
      };
    } else {
      return {
        text: 'PERTAHANKAN POSISI',
        bg: 'bg-slate-100 text-slate-700 border-slate-200',
        desc: 'Dipertahankan di posisi saat ini dengan pelatihan khusus.'
      };
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans selection:bg-blue-500 selection:text-white">
      {/* ==========================================
          HEADER / TOP BAR CONTRACT
          ========================================== */}
      <header className="sticky top-0 z-40 bg-slate-900 text-white shadow-md border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Zone 1: Brand Wordmark */}
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center font-bold text-lg text-white tracking-wider">
                JP
              </div>
              <div>
                <span className="text-base font-bold tracking-tight text-white block">
                  PT Jaya Prima Plastik
                </span>
                <span className="text-[10px] text-slate-400 font-mono tracking-wider block -mt-1">
                  SPK PROFILE MATCHING
                </span>
              </div>
            </div>

            {/* Zone 2: Navigation Links */}
            <nav className="hidden md:flex items-center gap-1">
              <button
                onClick={() => { setActiveTab('dashboard'); setIsAddingCandidate(false); }}
                className={`px-4 py-2 text-xs font-medium rounded-md transition-colors ${
                  activeTab === 'dashboard' ? 'bg-slate-800 text-blue-400' : 'text-slate-300 hover:text-white'
                }`}
              >
                Dashboard
              </button>
              <button
                onClick={() => { setActiveTab('candidates'); setIsAddingCandidate(false); }}
                className={`px-4 py-2 text-xs font-medium rounded-md transition-colors ${
                  activeTab === 'candidates' ? 'bg-slate-800 text-blue-400' : 'text-slate-300 hover:text-white'
                }`}
              >
                Data Karyawan
              </button>
              <button
                onClick={() => { setActiveTab('calculations'); setIsAddingCandidate(false); }}
                className={`px-4 py-2 text-xs font-medium rounded-md transition-colors ${
                  activeTab === 'calculations' ? 'bg-slate-800 text-blue-400' : 'text-slate-300 hover:text-white'
                }`}
              >
                Matriks Perhitungan
              </button>
              <button
                onClick={() => { setActiveTab('rankings'); setIsAddingCandidate(false); }}
                className={`px-4 py-2 text-xs font-medium rounded-md transition-colors ${
                  activeTab === 'rankings' ? 'bg-slate-800 text-blue-400' : 'text-slate-300 hover:text-white'
                }`}
              >
                Hasil & Peringkat
              </button>
            </nav>

            {/* Zone 3: Actions */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleOpenSettings}
                title="Konfigurasi Profil Standar"
                className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
              >
                <Settings className="w-4 h-4" />
              </button>
              <button
                onClick={triggerAddView}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-500 active:bg-blue-700 transition-all shadow-sm"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Karyawan Baru</span>
              </button>
              <button
                onClick={handleResetData}
                title="Reset seluruh data"
                className="p-2 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-slate-800 transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Sub-Navigation Bar */}
      <div className="md:hidden bg-slate-800 text-slate-200 border-b border-slate-700 py-2 px-4 flex justify-between items-center text-xs overflow-x-auto">
        <button
          onClick={() => { setActiveTab('dashboard'); setIsAddingCandidate(false); }}
          className={`font-semibold py-1 px-2 rounded ${activeTab === 'dashboard' ? 'bg-slate-700 text-white' : 'text-slate-400'}`}
        >
          Dashboard
        </button>
        <button
          onClick={() => { setActiveTab('candidates'); setIsAddingCandidate(false); }}
          className={`font-semibold py-1 px-2 rounded ${activeTab === 'candidates' ? 'bg-slate-700 text-white' : 'text-slate-400'}`}
        >
          Karyawan
        </button>
        <button
          onClick={() => { setActiveTab('calculations'); setIsAddingCandidate(false); }}
          className={`font-semibold py-1 px-2 rounded ${activeTab === 'calculations' ? 'bg-slate-700 text-white' : 'text-slate-400'}`}
        >
          Matriks Gap
        </button>
        <button
          onClick={() => { setActiveTab('rankings'); setIsAddingCandidate(false); }}
          className={`font-semibold py-1 px-2 rounded ${activeTab === 'rankings' ? 'bg-slate-700 text-white' : 'text-slate-400'}`}
        >
          Peringkat
        </button>
      </div>

      {/* ==========================================
          MAIN BODY LAYOUT
          ========================================== */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-8">
        
        {/* Active Target Banner Info */}
        <div className="bg-gradient-to-r from-blue-900 to-indigo-950 text-white rounded-xl p-5 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 p-10 transform translate-x-12 -translate-y-12 opacity-10 bg-white rounded-full w-48 h-48 pointer-events-none"></div>
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-1">
              <span className="text-[10px] tracking-widest font-mono text-blue-300 font-semibold block uppercase">
                Sistem Pendukung Keputusan Penilaian Kinerja
              </span>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white font-sans text-wrap">
                Pemilihan Promosi Jabatan Metode Profile Matching
              </h1>
              <p className="text-xs text-slate-300 max-w-2xl">
                Melakukan analisis gap kompetensi secara objektif dan transparan antara profil karyawan dengan kriteria standar jabatan di PT Jaya Prima Plastik.
              </p>
            </div>
            
            <div className="flex items-center gap-3 bg-slate-900/50 backdrop-blur-sm border border-white/10 rounded-lg p-3 shrink-0">
              <div className="space-y-1 text-right">
                <span className="text-[10px] text-slate-400 block font-mono">STANDAR JABATAN AKTIF</span>
                <div className="flex gap-2 text-xs font-mono">
                  <span className="bg-slate-800 text-slate-200 px-1.5 py-0.5 rounded border border-slate-700">SK: {standards.kedisiplinan},{standards.kejujuran},{standards.kerjasama}</span>
                  <span className="bg-slate-800 text-slate-200 px-1.5 py-0.5 rounded border border-slate-700">KP: {standards.tanggungJawab},{standards.inisiatif},{standards.adaptasi}</span>
                  <span className="bg-slate-800 text-slate-200 px-1.5 py-0.5 rounded border border-slate-700">TJ: {standards.pencapaianTarget},{standards.ketelitian}</span>
                </div>
              </div>
              <button
                onClick={handleOpenSettings}
                className="p-1.5 bg-blue-600 hover:bg-blue-500 rounded text-white transition-colors"
                title="Ubah Target"
              >
                <Settings className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* ==========================================
            SETTINGS/STANDARDS MODAL (POPUP)
            ========================================== */}
        {showSettings && (
          <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full border border-slate-200 overflow-hidden transform transition-all animate-in fade-in zoom-in duration-200">
              <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <Sliders className="w-5 h-5 text-blue-400" />
                  <h3 className="text-base font-bold text-white">Konfigurasi Target Profil Standar Jabatan</h3>
                </div>
                <button
                  onClick={() => setShowSettings(false)}
                  className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-6">
                <p className="text-xs text-slate-500">
                  Ubah target standar minimal (skala 1-5) untuk setiap sub-kriteria. Sistem akan secara dinamis menghitung ulang seluruh analisis GAP, konversi bobot, dan peringkat akhir karyawan.
                </p>

                <div className="space-y-4">
                  {/* Sikap Kerja */}
                  <div className="space-y-2 border-l-2 border-blue-500 pl-3">
                    <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Aspek Sikap Kerja (Bobot 35%)</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="text-xs text-slate-600 block mb-1">Kedisiplinan (CF)</label>
                        <input
                          type="number"
                          min="1"
                          max="5"
                          value={tempStandards.kedisiplinan}
                          onChange={(e) => setTempStandards({ ...tempStandards, kedisiplinan: parseInt(e.target.value) || 1 })}
                          className="w-full bg-slate-50 border border-slate-300 rounded px-2.5 py-1 text-xs font-mono"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-slate-600 block mb-1">Kejujuran (CF)</label>
                        <input
                          type="number"
                          min="1"
                          max="5"
                          value={tempStandards.kejujuran}
                          onChange={(e) => setTempStandards({ ...tempStandards, kejujuran: parseInt(e.target.value) || 1 })}
                          className="w-full bg-slate-50 border border-slate-300 rounded px-2.5 py-1 text-xs font-mono"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-slate-600 block mb-1">Kerjasama (SF)</label>
                        <input
                          type="number"
                          min="1"
                          max="5"
                          value={tempStandards.kerjasama}
                          onChange={(e) => setTempStandards({ ...tempStandards, kerjasama: parseInt(e.target.value) || 1 })}
                          className="w-full bg-slate-50 border border-slate-300 rounded px-2.5 py-1 text-xs font-mono"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Kepribadian */}
                  <div className="space-y-2 border-l-2 border-indigo-500 pl-3">
                    <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Aspek Kepribadian (Bobot 30%)</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="text-xs text-slate-600 block mb-1">Tanggung Jawab (CF)</label>
                        <input
                          type="number"
                          min="1"
                          max="5"
                          value={tempStandards.tanggungJawab}
                          onChange={(e) => setTempStandards({ ...tempStandards, tanggungJawab: parseInt(e.target.value) || 1 })}
                          className="w-full bg-slate-50 border border-slate-300 rounded px-2.5 py-1 text-xs font-mono"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-slate-600 block mb-1">Inisiatif (SF)</label>
                        <input
                          type="number"
                          min="1"
                          max="5"
                          value={tempStandards.inisiatif}
                          onChange={(e) => setTempStandards({ ...tempStandards, inisiatif: parseInt(e.target.value) || 1 })}
                          className="w-full bg-slate-50 border border-slate-300 rounded px-2.5 py-1 text-xs font-mono"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-slate-600 block mb-1">Adaptasi (SF)</label>
                        <input
                          type="number"
                          min="1"
                          max="5"
                          value={tempStandards.adaptasi}
                          onChange={(e) => setTempStandards({ ...tempStandards, adaptasi: parseInt(e.target.value) || 1 })}
                          className="w-full bg-slate-50 border border-slate-300 rounded px-2.5 py-1 text-xs font-mono"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Tanggung Jawab */}
                  <div className="space-y-2 border-l-2 border-emerald-500 pl-3">
                    <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Aspek Tanggung Jawab (Bobot 35%)</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs text-slate-600 block mb-1">Pencapaian Target (CF)</label>
                        <input
                          type="number"
                          min="1"
                          max="5"
                          value={tempStandards.pencapaianTarget}
                          onChange={(e) => setTempStandards({ ...tempStandards, pencapaianTarget: parseInt(e.target.value) || 1 })}
                          className="w-full bg-slate-50 border border-slate-300 rounded px-2.5 py-1 text-xs font-mono"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-slate-600 block mb-1">Ketelitian (SF)</label>
                        <input
                          type="number"
                          min="1"
                          max="5"
                          value={tempStandards.ketelitian}
                          onChange={(e) => setTempStandards({ ...tempStandards, ketelitian: parseInt(e.target.value) || 1 })}
                          className="w-full bg-slate-50 border border-slate-300 rounded px-2.5 py-1 text-xs font-mono"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-slate-50 px-6 py-4 flex justify-between border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setTempStandards(DEFAULT_STANDARDS)}
                  className="flex items-center gap-1 px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Default Pabrik</span>
                </button>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setShowSettings(false)}
                    className="px-4 py-2 text-xs font-semibold text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                  >
                    Batal
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveStandards}
                    className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors"
                  >
                    Terapkan Standar Baru
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ==========================================
            VIEW: ADD / EDIT FORM
            ========================================== */}
        {isAddingCandidate && (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden transform transition-all duration-300">
            <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <Users className="w-5 h-5 text-blue-400" />
                <h3 className="text-base font-bold text-white">
                  {editingCandidate ? `Edit Nilai Karyawan: ${editingCandidate.name}` : 'Tambah Karyawan Baru & Isi Nilai Evaluasi'}
                </h3>
              </div>
              <button
                onClick={() => setIsAddingCandidate(false)}
                className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="p-6 space-y-6">
              {/* Profile Identity */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Nama Karyawan *</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Joko Widodo"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs font-medium focus:border-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Jabatan *</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Operator Produksi"
                    value={formRole}
                    onChange={(e) => setFormRole(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs font-medium focus:border-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Departemen *</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Produksi Moulding"
                    value={formDepartment}
                    onChange={(e) => setFormDepartment(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs font-medium focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="border-t border-slate-200 pt-6">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-4 flex items-center gap-1.5">
                  <Calculator className="w-4 h-4 text-blue-600" />
                  <span>Nilai Evaluasi Kompetensi (Skala 1 - 5)</span>
                </h4>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Aspect 1 */}
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                      <span className="text-xs font-bold text-slate-800">1. Aspek Sikap Kerja (35%)</span>
                      <span className="text-[10px] text-slate-400 font-mono">Bobot CF:60% SF:40%</span>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-slate-700">Kedisiplinan <span className="text-[10px] text-blue-600 font-semibold">(CF, Target {standards.kedisiplinan})</span></span>
                          <span className="font-bold text-slate-950 font-mono">{formScores.kedisiplinan} / 5</span>
                        </div>
                        <input
                          type="range" min="1" max="5" step="1"
                          value={formScores.kedisiplinan}
                          onChange={(e) => setFormScores({ ...formScores, kedisiplinan: parseInt(e.target.value) })}
                          className="w-full accent-blue-600 cursor-pointer"
                        />
                      </div>
                      <div>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-slate-700">Kejujuran <span className="text-[10px] text-blue-600 font-semibold">(CF, Target {standards.kejujuran})</span></span>
                          <span className="font-bold text-slate-950 font-mono">{formScores.kejujuran} / 5</span>
                        </div>
                        <input
                          type="range" min="1" max="5" step="1"
                          value={formScores.kejujuran}
                          onChange={(e) => setFormScores({ ...formScores, kejujuran: parseInt(e.target.value) })}
                          className="w-full accent-blue-600 cursor-pointer"
                        />
                      </div>
                      <div>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-slate-700">Kerjasama <span className="text-[10px] text-amber-600 font-semibold">(SF, Target {standards.kerjasama})</span></span>
                          <span className="font-bold text-slate-950 font-mono">{formScores.kerjasama} / 5</span>
                        </div>
                        <input
                          type="range" min="1" max="5" step="1"
                          value={formScores.kerjasama}
                          onChange={(e) => setFormScores({ ...formScores, kerjasama: parseInt(e.target.value) })}
                          className="w-full accent-blue-600 cursor-pointer"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Aspect 2 */}
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                      <span className="text-xs font-bold text-slate-800">2. Aspek Kepribadian (30%)</span>
                      <span className="text-[10px] text-slate-400 font-mono">Bobot CF:60% SF:40%</span>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-slate-700">Tanggung Jawab <span className="text-[10px] text-blue-600 font-semibold">(CF, Target {standards.tanggungJawab})</span></span>
                          <span className="font-bold text-slate-950 font-mono">{formScores.tanggungJawab} / 5</span>
                        </div>
                        <input
                          type="range" min="1" max="5" step="1"
                          value={formScores.tanggungJawab}
                          onChange={(e) => setFormScores({ ...formScores, tanggungJawab: parseInt(e.target.value) })}
                          className="w-full accent-indigo-600 cursor-pointer"
                        />
                      </div>
                      <div>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-slate-700">Inisiatif <span className="text-[10px] text-amber-600 font-semibold">(SF, Target {standards.inisiatif})</span></span>
                          <span className="font-bold text-slate-950 font-mono">{formScores.inisiatif} / 5</span>
                        </div>
                        <input
                          type="range" min="1" max="5" step="1"
                          value={formScores.inisiatif}
                          onChange={(e) => setFormScores({ ...formScores, inisiatif: parseInt(e.target.value) })}
                          className="w-full accent-indigo-600 cursor-pointer"
                        />
                      </div>
                      <div>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-slate-700">Adaptasi <span className="text-[10px] text-amber-600 font-semibold">(SF, Target {standards.adaptasi})</span></span>
                          <span className="font-bold text-slate-950 font-mono">{formScores.adaptasi} / 5</span>
                        </div>
                        <input
                          type="range" min="1" max="5" step="1"
                          value={formScores.adaptasi}
                          onChange={(e) => setFormScores({ ...formScores, adaptasi: parseInt(e.target.value) })}
                          className="w-full accent-indigo-600 cursor-pointer"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Aspect 3 */}
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                      <span className="text-xs font-bold text-slate-800">3. Aspek Tanggung Jawab (35%)</span>
                      <span className="text-[10px] text-slate-400 font-mono">Bobot CF:60% SF:40%</span>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-slate-700">Pencapaian Target <span className="text-[10px] text-blue-600 font-semibold">(CF, Target {standards.pencapaianTarget})</span></span>
                          <span className="font-bold text-slate-950 font-mono">{formScores.pencapaianTarget} / 5</span>
                        </div>
                        <input
                          type="range" min="1" max="5" step="1"
                          value={formScores.pencapaianTarget}
                          onChange={(e) => setFormScores({ ...formScores, pencapaianTarget: parseInt(e.target.value) })}
                          className="w-full accent-emerald-600 cursor-pointer"
                        />
                      </div>
                      <div>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-slate-700">Ketelitian <span className="text-[10px] text-amber-600 font-semibold">(SF, Target {standards.ketelitian})</span></span>
                          <span className="font-bold text-slate-950 font-mono">{formScores.ketelitian} / 5</span>
                        </div>
                        <input
                          type="range" min="1" max="5" step="1"
                          value={formScores.ketelitian}
                          onChange={(e) => setFormScores({ ...formScores, ketelitian: parseInt(e.target.value) })}
                          className="w-full accent-emerald-600 cursor-pointer"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-slate-50 px-6 py-4 flex justify-end gap-3 border-t border-slate-200 -mx-6 -mb-6">
                <button
                  type="button"
                  onClick={() => setIsAddingCandidate(false)}
                  className="px-5 py-2.5 text-xs font-semibold text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors flex items-center gap-1"
                >
                  <Check className="w-4 h-4" />
                  <span>{editingCandidate ? 'Simpan Perubahan' : 'Simpan Karyawan'}</span>
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ==========================================
            VIEW: 1. DASHBOARD
            ========================================== */}
        {activeTab === 'dashboard' && !isAddingCandidate && (
          <div className="space-y-8 animate-in fade-in duration-300">
            {/* KPI Widgets */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white border border-slate-200 rounded-xl p-5 flex items-center gap-4 shadow-xs">
                <div className="w-12 h-12 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
                  <Users className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">Total Evaluasi</span>
                  <span className="text-2xl font-extrabold text-slate-900 font-mono tabular-nums">{stats.total}</span>
                  <span className="text-xs text-slate-500 block">Karyawan Terdaftar</span>
                </div>
              </div>

              <div className="bg-white border border-slate-200 rounded-xl p-5 flex items-center gap-4 shadow-xs">
                <div className="w-12 h-12 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0">
                  <Award className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">Peringkat Teratas</span>
                  <span className="text-base font-bold text-slate-900 block truncate max-w-[150px]">{stats.topCand ? stats.topCand.name : '-'}</span>
                  <span className="text-xs text-slate-500 block font-mono">Skor: {stats.topCand ? stats.topCand.finalScore.toFixed(3) : '-'}</span>
                </div>
              </div>

              <div className="bg-white border border-slate-200 rounded-xl p-5 flex items-center gap-4 shadow-xs">
                <div className="w-12 h-12 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 shrink-0">
                  <TrendingUp className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">Rata-rata Skor</span>
                  <span className="text-2xl font-extrabold text-slate-900 font-mono tabular-nums">{stats.avgScore.toFixed(3)}</span>
                  <span className="text-xs text-slate-500 block">Dari Nilai Ideal 5.0</span>
                </div>
              </div>

              <div className="bg-white border border-slate-200 rounded-xl p-5 flex items-center gap-4 shadow-xs">
                <div className="w-12 h-12 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600 shrink-0">
                  <Layers className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">Siap Promosi</span>
                  <span className="text-2xl font-extrabold text-slate-900 font-mono tabular-nums">{stats.countRecommended}</span>
                  <span className="text-xs text-slate-500 block">Skor &ge; 3.50</span>
                </div>
              </div>
            </div>

            {/* Quick Math Lookup & Flow Guidelines */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Standar Target Kriteria */}
              <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                    <Briefcase className="w-4 h-4 text-slate-600" />
                    <span>Konfigurasi Target Kriteria</span>
                  </h3>
                  <button
                    onClick={handleOpenSettings}
                    className="text-xs font-semibold text-blue-600 hover:text-blue-700"
                  >
                    Ubah
                  </button>
                </div>

                <div className="space-y-4">
                  {/* Sikap Kerja */}
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">Aspek Sikap Kerja (35%)</span>
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div className="bg-slate-50 border border-slate-200 rounded p-1.5 text-center">
                        <span className="text-slate-500 block text-[9px] truncate">Disiplin (CF)</span>
                        <span className="font-bold text-slate-900 font-mono">{standards.kedisiplinan}</span>
                      </div>
                      <div className="bg-slate-50 border border-slate-200 rounded p-1.5 text-center">
                        <span className="text-slate-500 block text-[9px] truncate">Jujur (CF)</span>
                        <span className="font-bold text-slate-900 font-mono">{standards.kejujuran}</span>
                      </div>
                      <div className="bg-slate-50 border border-slate-200 rounded p-1.5 text-center">
                        <span className="text-slate-500 block text-[9px] truncate">Kerjasama (SF)</span>
                        <span className="font-bold text-slate-900 font-mono">{standards.kerjasama}</span>
                      </div>
                    </div>
                  </div>

                  {/* Kepribadian */}
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">Aspek Kepribadian (30%)</span>
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div className="bg-slate-50 border border-slate-200 rounded p-1.5 text-center">
                        <span className="text-slate-500 block text-[9px] truncate">Tngg. Jwb (CF)</span>
                        <span className="font-bold text-slate-900 font-mono">{standards.tanggungJawab}</span>
                      </div>
                      <div className="bg-slate-50 border border-slate-200 rounded p-1.5 text-center">
                        <span className="text-slate-500 block text-[9px] truncate">Inisiatif (SF)</span>
                        <span className="font-bold text-slate-900 font-mono">{standards.inisiatif}</span>
                      </div>
                      <div className="bg-slate-50 border border-slate-200 rounded p-1.5 text-center">
                        <span className="text-slate-500 block text-[9px] truncate">Adaptasi (SF)</span>
                        <span className="font-bold text-slate-900 font-mono">{standards.adaptasi}</span>
                      </div>
                    </div>
                  </div>

                  {/* Tanggung Jawab */}
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">Aspek Tanggung Jawab (35%)</span>
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div className="bg-slate-50 border border-slate-200 rounded p-1.5 text-center col-span-2">
                        <span className="text-slate-500 block text-[9px] truncate">Pencapaian Target (CF)</span>
                        <span className="font-bold text-slate-900 font-mono">{standards.pencapaianTarget}</span>
                      </div>
                      <div className="bg-slate-50 border border-slate-200 rounded p-1.5 text-center">
                        <span className="text-slate-500 block text-[9px] truncate">Ketelitian (SF)</span>
                        <span className="font-bold text-slate-900 font-mono">{standards.ketelitian}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Aturan Bobot Nilai GAP */}
              <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                    <HelpCircle className="w-4 h-4 text-slate-600" />
                    <span>Tabel Konversi Bobot GAP</span>
                  </h3>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-xs font-mono">
                    <thead>
                      <tr className="border-b border-slate-100 text-[10px] text-slate-400 text-left">
                        <th className="pb-1.5 font-semibold">Selisih GAP</th>
                        <th className="pb-1.5 font-semibold text-center">Bobot</th>
                        <th className="pb-1.5 font-semibold text-right">Keterangan</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      <tr>
                        <td className="py-1">0</td>
                        <td className="py-1 text-center font-bold text-emerald-600">3.0</td>
                        <td className="py-1 text-right text-[10px] text-slate-400">Sesuai Kebutuhan</td>
                      </tr>
                      <tr>
                        <td className="py-1">+1 / -1</td>
                        <td className="py-1 text-center font-semibold text-slate-900">3.5 / 2.5</td>
                        <td className="py-1 text-right text-[10px] text-slate-400">Kelebihan / Kekurangan 1 Tingkat</td>
                      </tr>
                      <tr>
                        <td className="py-1">+2 / -2</td>
                        <td className="py-1 text-center font-semibold text-slate-900">4.0 / 2.0</td>
                        <td className="py-1 text-right text-[10px] text-slate-400">Kelebihan / Kekurangan 2 Tingkat</td>
                      </tr>
                      <tr>
                        <td className="py-1">+3 / -3</td>
                        <td className="py-1 text-center font-semibold text-slate-900">4.5 / 1.5</td>
                        <td className="py-1 text-right text-[10px] text-slate-400">Kelebihan / Kekurangan 3 Tingkat</td>
                      </tr>
                      <tr>
                        <td className="py-1">+4 / -4</td>
                        <td className="py-1 text-center font-semibold text-slate-900">5.0 / 1.0</td>
                        <td className="py-1 text-right text-[10px] text-slate-400">Kelebihan / Kekurangan 4 Tingkat</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Ringkasan Logika SPK */}
              <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                    <Calculator className="w-4 h-4 text-slate-600" />
                    <span>Bobot Aspek & Logika</span>
                  </h3>
                </div>

                <div className="space-y-4 text-xs">
                  <div className="space-y-2 text-slate-600">
                    <div className="flex justify-between">
                      <span className="font-semibold text-slate-800">1. Formula Aspek:</span>
                      <span className="font-mono text-[11px] font-semibold text-slate-900 bg-slate-50 px-1 rounded">(60% &times; NCF) + (40% &times; NSF)</span>
                    </div>
                    <p className="text-[10px] text-slate-500 leading-relaxed">
                      Core Factor (NCF) menilai aspek utama penentu kinerja jabatan, sedangkan Secondary Factor (NSF) merupakan penunjang.
                    </p>
                  </div>

                  <div className="space-y-2 text-slate-600 border-t border-slate-100 pt-3">
                    <div className="flex justify-between">
                      <span className="font-semibold text-slate-800">2. Bobot Evaluasi Akhir:</span>
                    </div>
                    <ul className="space-y-1 pl-4 list-disc text-[11px] font-mono text-slate-800">
                      <li>Sikap Kerja: 35%</li>
                      <li>Kepribadian: 30%</li>
                      <li>Tanggung Jawab: 35%</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* Top Recommended Promoted Candidates */}
            <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
              <div className="px-6 py-5 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h3 className="text-base font-bold text-slate-900">Leaderboard Calon Promosi Terbaik</h3>
                  <p className="text-xs text-slate-500">Urutan karyawan terbaik berdasarkan total skor Profile Matching.</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setActiveTab('rankings')}
                    className="flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors"
                  >
                    <span>Analisis Detail</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={exportSummaryData}
                    className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Laporan</span>
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 text-[11px] uppercase font-bold">
                      <th className="py-3 px-6 text-center w-12">No</th>
                      <th className="py-3 px-6">Nama Karyawan</th>
                      <th className="py-3 px-6">Departemen</th>
                      <th className="py-3 px-6 text-center">Sikap Kerja (35%)</th>
                      <th className="py-3 px-6 text-center">Kepribadian (30%)</th>
                      <th className="py-3 px-6 text-center">Tanggung Jawab (35%)</th>
                      <th className="py-3 px-6 text-right">Skor Akhir</th>
                      <th className="py-3 px-6 text-center">Rekomendasi</th>
                      <th className="py-3 px-6 text-center">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {rankedCandidates.map((cand, idx) => {
                      const rec = getRecommendationBadge(cand.finalScore);
                      const isTop = idx === 0;

                      return (
                        <tr
                          key={cand.id}
                          className={`hover:bg-slate-50 transition-colors ${
                            isTop ? 'bg-amber-50/20 font-medium' : ''
                          }`}
                        >
                          <td className="py-3.5 px-6 text-center font-mono font-bold">
                            {idx + 1 === 1 ? (
                              <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-amber-500 text-white text-xs">
                                1
                              </span>
                            ) : idx + 1 === 2 ? (
                              <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-slate-300 text-slate-900 text-xs">
                                2
                              </span>
                            ) : idx + 1 === 3 ? (
                              <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-amber-700/80 text-white text-xs">
                                3
                              </span>
                            ) : (
                              <span className="text-slate-500">{idx + 1}</span>
                            )}
                          </td>
                          <td className="py-3.5 px-6">
                            <div>
                              <span className="font-bold text-slate-900 block">{cand.name}</span>
                              <span className="text-[10px] text-slate-500 block">{cand.role}</span>
                            </div>
                          </td>
                          <td className="py-3.5 px-6 text-slate-600 font-medium">{cand.department}</td>
                          
                          {/* Aspect Values */}
                          <td className="py-3.5 px-6 text-center font-mono">
                            {cand.calculations.sikapKerja.total.toFixed(2)}
                          </td>
                          <td className="py-3.5 px-6 text-center font-mono">
                            {cand.calculations.kepribadian.total.toFixed(2)}
                          </td>
                          <td className="py-3.5 px-6 text-center font-mono">
                            {cand.calculations.tanggungJawab.total.toFixed(2)}
                          </td>

                          {/* Final Score */}
                          <td className="py-3.5 px-6 text-right font-mono font-extrabold text-blue-700">
                            {cand.finalScore.toFixed(3)}
                          </td>

                          {/* Recommendation */}
                          <td className="py-3.5 px-6 text-center whitespace-nowrap">
                            <span className={`inline-block px-2.5 py-0.5 text-[9px] font-bold rounded-full border ${rec.bg}`}>
                              {rec.text}
                            </span>
                          </td>

                          <td className="py-3.5 px-6 text-center">
                            <button
                              onClick={() => {
                                setSelectedCandidateId(cand.id);
                                setActiveTab('calculations');
                              }}
                              className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"
                              title="Lihat Kalkulasi Matematika"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ==========================================
            VIEW: 2. CANDIDATES LIST / CRUD
            ========================================== */}
        {activeTab === 'candidates' && !isAddingCandidate && (
          <div className="space-y-6 animate-in fade-in duration-300">
            {/* Filter / Search Bar */}
            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex flex-col md:flex-row gap-4 justify-between items-center">
              <div className="relative w-full md:max-w-md">
                <input
                  type="text"
                  placeholder="Cari nama karyawan atau jabatan..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex gap-2 w-full md:w-auto">
                <select
                  value={filterDept}
                  onChange={(e) => setFilterDept(e.target.value)}
                  className="bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs font-medium focus:outline-none"
                >
                  <option value="All">Semua Departemen</option>
                  {departments.filter(d => d !== 'All').map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>

                <button
                  onClick={triggerAddView}
                  className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 rounded-lg transition-all shadow-sm shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Karyawan Baru</span>
                </button>
              </div>
            </div>

            {/* Candidates Card Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {rankedCandidates
                .filter((c) => {
                  const matchSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                      c.role.toLowerCase().includes(searchTerm.toLowerCase());
                  const matchDept = filterDept === 'All' || c.department === filterDept;
                  return matchSearch && matchDept;
                })
                .map((cand) => {
                  const rec = getRecommendationBadge(cand.finalScore);

                  return (
                    <div key={cand.id} className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden flex flex-col">
                      <div className="p-5 border-b border-slate-100">
                        <div className="flex justify-between items-start gap-4">
                          <div>
                            <span className="text-[10px] text-blue-600 font-bold uppercase block tracking-wider">{cand.department}</span>
                            <h4 className="text-sm font-bold text-slate-900 mt-0.5">{cand.name}</h4>
                            <span className="text-xs text-slate-500 block">{cand.role}</span>
                          </div>
                          <div className="text-right">
                            <span className="text-[9px] text-slate-400 font-mono block">SKOR MATCH</span>
                            <span className="text-lg font-black text-blue-700 font-mono leading-none block">{cand.finalScore.toFixed(3)}</span>
                          </div>
                        </div>

                        <div className="mt-3">
                          <span className={`inline-block px-2.5 py-0.5 text-[9px] font-bold rounded-full border ${rec.bg}`}>
                            {rec.text}
                          </span>
                        </div>
                      </div>

                      {/* Attribute Scores Panel */}
                      <div className="p-4 bg-slate-50/50 flex-1 space-y-3">
                        {/* Sikap Kerja Scores */}
                        <div className="space-y-1">
                          <span className="text-[9px] text-slate-400 font-bold uppercase block tracking-wider">Sikap Kerja</span>
                          <div className="grid grid-cols-3 gap-2 text-[11px] font-mono">
                            <div className="bg-white border border-slate-100 rounded px-1.5 py-1 text-center">
                              <span className="text-slate-500 block text-[8px] truncate">Disiplin</span>
                              <span className="font-bold text-slate-900">{cand.scores.kedisiplinan}</span>
                              <span className="text-[8px] text-slate-400 block mt-0.5">Tar: {standards.kedisiplinan}</span>
                            </div>
                            <div className="bg-white border border-slate-100 rounded px-1.5 py-1 text-center">
                              <span className="text-slate-500 block text-[8px] truncate">Jujur</span>
                              <span className="font-bold text-slate-900">{cand.scores.kejujuran}</span>
                              <span className="text-[8px] text-slate-400 block mt-0.5">Tar: {standards.kejujuran}</span>
                            </div>
                            <div className="bg-white border border-slate-100 rounded px-1.5 py-1 text-center">
                              <span className="text-slate-500 block text-[8px] truncate">Kerjasama</span>
                              <span className="font-bold text-slate-900">{cand.scores.kerjasama}</span>
                              <span className="text-[8px] text-slate-400 block mt-0.5">Tar: {standards.kerjasama}</span>
                            </div>
                          </div>
                        </div>

                        {/* Kepribadian Scores */}
                        <div className="space-y-1">
                          <span className="text-[9px] text-slate-400 font-bold uppercase block tracking-wider">Kepribadian</span>
                          <div className="grid grid-cols-3 gap-2 text-[11px] font-mono">
                            <div className="bg-white border border-slate-100 rounded px-1.5 py-1 text-center">
                              <span className="text-slate-500 block text-[8px] truncate">Tanggung Jwb</span>
                              <span className="font-bold text-slate-900">{cand.scores.tanggungJawab}</span>
                              <span className="text-[8px] text-slate-400 block mt-0.5">Tar: {standards.tanggungJawab}</span>
                            </div>
                            <div className="bg-white border border-slate-100 rounded px-1.5 py-1 text-center">
                              <span className="text-slate-500 block text-[8px] truncate">Inisiatif</span>
                              <span className="font-bold text-slate-900">{cand.scores.inisiatif}</span>
                              <span className="text-[8px] text-slate-400 block mt-0.5">Tar: {standards.inisiatif}</span>
                            </div>
                            <div className="bg-white border border-slate-100 rounded px-1.5 py-1 text-center">
                              <span className="text-slate-500 block text-[8px] truncate">Adaptasi</span>
                              <span className="font-bold text-slate-900">{cand.scores.adaptasi}</span>
                              <span className="text-[8px] text-slate-400 block mt-0.5">Tar: {standards.adaptasi}</span>
                            </div>
                          </div>
                        </div>

                        {/* Tanggung Jawab Scores */}
                        <div className="space-y-1">
                          <span className="text-[9px] text-slate-400 font-bold uppercase block tracking-wider">Tanggung Jawab</span>
                          <div className="grid grid-cols-3 gap-2 text-[11px] font-mono">
                            <div className="bg-white border border-slate-100 rounded px-1.5 py-1 text-center col-span-2">
                              <span className="text-slate-500 block text-[8px] truncate">Pencapaian Target</span>
                              <span className="font-bold text-slate-900">{cand.scores.pencapaianTarget}</span>
                              <span className="text-[8px] text-slate-400 block mt-0.5">Tar: {standards.pencapaianTarget}</span>
                            </div>
                            <div className="bg-white border border-slate-100 rounded px-1.5 py-1 text-center">
                              <span className="text-slate-500 block text-[8px] truncate">Ketelitian</span>
                              <span className="font-bold text-slate-900">{cand.scores.ketelitian}</span>
                              <span className="text-[8px] text-slate-400 block mt-0.5">Tar: {standards.ketelitian}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Action buttons on card */}
                      <div className="p-3 bg-slate-100 border-t border-slate-200 flex justify-between items-center gap-2">
                        <button
                          onClick={() => {
                            setSelectedCandidateId(cand.id);
                            setActiveTab('calculations');
                          }}
                          className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold text-slate-700 hover:text-blue-700 bg-white hover:bg-slate-50 rounded border border-slate-200 transition-colors"
                        >
                          <Calculator className="w-3.5 h-3.5" />
                          <span>Math Audit</span>
                        </button>

                        <div className="flex gap-1.5">
                          <button
                            onClick={() => handleEditClick(cand)}
                            className="p-1.5 text-slate-600 hover:text-blue-600 bg-white hover:bg-slate-50 rounded border border-slate-200 transition-colors"
                            title="Edit Data Nilai"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteCandidate(cand.id)}
                            className="p-1.5 text-slate-600 hover:text-rose-600 bg-white hover:bg-slate-50 rounded border border-slate-200 transition-colors"
                            title="Hapus Karyawan"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        )}

        {/* ==========================================
            VIEW: 3. DETAILED PROFILE MATCHING CALCULATIONS
            ========================================== */}
        {activeTab === 'calculations' && !isAddingCandidate && (
          <div className="space-y-8 animate-in fade-in duration-300">
            
            {/* Top Bar for selection */}
            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex flex-col sm:flex-row justify-between items-center gap-4">
              <div className="flex items-center gap-2">
                <Calculator className="w-5 h-5 text-blue-600" />
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Alur & Rumus Audit Profile Matching</h3>
                  <p className="text-[11px] text-slate-500">Pilih karyawan untuk melihat detail kalkulasi langkah demi langkah.</p>
                </div>
              </div>

              <select
                value={selectedCandidateId}
                onChange={(e) => setSelectedCandidateId(e.target.value)}
                className="bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs font-semibold focus:outline-none"
              >
                {candidates.map((c) => (
                  <option key={c.id} value={c.id}>{c.name} ({c.role})</option>
                ))}
              </select>
            </div>

            {/* Calculations Breakdown Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              {/* Core Math Steps Map */}
              <div className="lg:col-span-2 space-y-8">
                
                {/* Step 1: Input vs Standar & GAP */}
                <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-4">
                  <div className="border-b border-slate-100 pb-3 flex justify-between items-center">
                    <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                      Langkah 1: Matriks Nilai & Perhitungan GAP
                    </h4>
                    <span className="text-[10px] font-mono text-slate-400 font-semibold bg-slate-50 px-1.5 py-0.5 rounded border">
                      Formula: GAP = Nilai - Standar
                    </span>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs font-mono">
                      <thead>
                        <tr className="bg-slate-50 text-slate-400 text-[10px] font-bold border-b border-slate-100">
                          <th className="py-2.5 px-3">Aspek & Kriteria</th>
                          <th className="py-2.5 px-3 text-center">Faktor</th>
                          <th className="py-2.5 px-3 text-center">Nilai Karyawan</th>
                          <th className="py-2.5 px-3 text-center">Standar Target</th>
                          <th className="py-2.5 px-3 text-center">Selisih GAP</th>
                          <th className="py-2.5 px-3 text-center">Bobot GAP</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {/* Sikap Kerja */}
                        <tr className="bg-slate-50/50 font-sans font-bold">
                          <td colSpan={6} className="py-2 px-3 text-slate-800 text-xs">Aspek Sikap Kerja (Bobot 35%)</td>
                        </tr>
                        {ASPECT_INFO.sikapKerja.criteria.map((cr) => {
                          const val = selectedCandidate.scores[cr.key];
                          const std = standards[cr.key];
                          const gap = selectedResult.gaps[cr.key];
                          const wt = selectedResult.weights[cr.key];

                          return (
                            <tr key={cr.key} className="hover:bg-slate-50/30">
                              <td className="py-2 px-3 font-sans text-slate-700 font-medium pl-6">{cr.label}</td>
                              <td className="py-2 px-3 text-center text-[10px] text-slate-500 font-sans">{cr.type}</td>
                              <td className="py-2 px-3 text-center font-bold text-slate-900">{val}</td>
                              <td className="py-2 px-3 text-center text-slate-500">{std}</td>
                              <td className={`py-2 px-3 text-center ${getGapColorClass(gap)}`}>
                                {gap > 0 ? `+${gap}` : gap}
                              </td>
                              <td className="py-2 px-3 text-center font-bold text-blue-700 bg-blue-50/20">{wt.toFixed(1)}</td>
                            </tr>
                          );
                        })}

                        {/* Kepribadian */}
                        <tr className="bg-slate-50/50 font-sans font-bold">
                          <td colSpan={6} className="py-2 px-3 text-slate-800 text-xs">Aspek Kepribadian (Bobot 30%)</td>
                        </tr>
                        {ASPECT_INFO.kepribadian.criteria.map((cr) => {
                          const val = selectedCandidate.scores[cr.key];
                          const std = standards[cr.key];
                          const gap = selectedResult.gaps[cr.key];
                          const wt = selectedResult.weights[cr.key];

                          return (
                            <tr key={cr.key} className="hover:bg-slate-50/30">
                              <td className="py-2 px-3 font-sans text-slate-700 font-medium pl-6">{cr.label}</td>
                              <td className="py-2 px-3 text-center text-[10px] text-slate-500 font-sans">{cr.type}</td>
                              <td className="py-2 px-3 text-center font-bold text-slate-900">{val}</td>
                              <td className="py-2 px-3 text-center text-slate-500">{std}</td>
                              <td className={`py-2 px-3 text-center ${getGapColorClass(gap)}`}>
                                {gap > 0 ? `+${gap}` : gap}
                              </td>
                              <td className="py-2 px-3 text-center font-bold text-blue-700 bg-blue-50/20">{wt.toFixed(1)}</td>
                            </tr>
                          );
                        })}

                        {/* Tanggung Jawab */}
                        <tr className="bg-slate-50/50 font-sans font-bold">
                          <td colSpan={6} className="py-2 px-3 text-slate-800 text-xs">Aspek Tanggung Jawab (Bobot 35%)</td>
                        </tr>
                        {ASPECT_INFO.tanggungJawab.criteria.map((cr) => {
                          const val = selectedCandidate.scores[cr.key];
                          const std = standards[cr.key];
                          const gap = selectedResult.gaps[cr.key];
                          const wt = selectedResult.weights[cr.key];

                          return (
                            <tr key={cr.key} className="hover:bg-slate-50/30">
                              <td className="py-2 px-3 font-sans text-slate-700 font-medium pl-6">{cr.label}</td>
                              <td className="py-2 px-3 text-center text-[10px] text-slate-500 font-sans">{cr.type}</td>
                              <td className="py-2 px-3 text-center font-bold text-slate-900">{val}</td>
                              <td className="py-2 px-3 text-center text-slate-500">{std}</td>
                              <td className={`py-2 px-3 text-center ${getGapColorClass(gap)}`}>
                                {gap > 0 ? `+${gap}` : gap}
                              </td>
                              <td className="py-2 px-3 text-center font-bold text-blue-700 bg-blue-50/20">{wt.toFixed(1)}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Step 2: NCF and NSF averages */}
                <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-5">
                  <div className="border-b border-slate-100 pb-3 flex justify-between items-center">
                    <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                      Langkah 2: Perhitungan Nilai Core & Secondary Factor per Aspek
                    </h4>
                    <span className="text-[10px] font-mono text-indigo-600 font-semibold bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-100">
                      Formula: NCF/NSF = &sum;Bobot GAP / Jumlah Sub-kriteria
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono text-xs">
                    {/* Sikap Kerja Breakdown */}
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3 font-sans">
                      <span className="text-[10px] font-bold text-blue-700 uppercase tracking-wider block">1. SIKAP KERJA (SK)</span>
                      
                      <div className="space-y-1.5 text-xs text-slate-600 font-mono">
                        <div className="flex justify-between">
                          <span>Core (Dis, Juj):</span>
                          <span className="font-bold text-slate-900">
                            ({selectedResult.weights.kedisiplinan.toFixed(1)} + {selectedResult.weights.kejujuran.toFixed(1)}) / 2 = {selectedResult.sikapKerja.ncf.toFixed(2)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Secondary (Ker):</span>
                          <span className="font-bold text-slate-900">
                            {selectedResult.weights.kerjasama.toFixed(1)} / 1 = {selectedResult.sikapKerja.nsf.toFixed(2)}
                          </span>
                        </div>
                      </div>

                      <div className="bg-white p-2.5 rounded border border-slate-200 text-xs font-mono">
                        <span className="text-[9px] text-slate-400 block font-sans">TOTAL SKOR SK</span>
                        <span className="text-[10px] block mt-0.5 text-slate-500">(60% &times; {selectedResult.sikapKerja.ncf.toFixed(2)}) + (40% &times; {selectedResult.sikapKerja.nsf.toFixed(2)})</span>
                        <span className="text-base font-black text-slate-900 block mt-1">
                          = {selectedResult.sikapKerja.total.toFixed(3)}
                        </span>
                      </div>
                    </div>

                    {/* Kepribadian Breakdown */}
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3 font-sans">
                      <span className="text-[10px] font-bold text-indigo-700 uppercase tracking-wider block">2. KEPRIBADIAN (KP)</span>
                      
                      <div className="space-y-1.5 text-xs text-slate-600 font-mono">
                        <div className="flex justify-between">
                          <span>Core (Tanggung Jwb):</span>
                          <span className="font-bold text-slate-900">
                            {selectedResult.weights.tanggungJawab.toFixed(1)} / 1 = {selectedResult.kepribadian.ncf.toFixed(2)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Secondary (Ini, Ada):</span>
                          <span className="font-bold text-slate-900">
                            ({selectedResult.weights.inisiatif.toFixed(1)} + {selectedResult.weights.adaptasi.toFixed(1)}) / 2 = {selectedResult.kepribadian.nsf.toFixed(2)}
                          </span>
                        </div>
                      </div>

                      <div className="bg-white p-2.5 rounded border border-slate-200 text-xs font-mono">
                        <span className="text-[9px] text-slate-400 block font-sans">TOTAL SKOR KP</span>
                        <span className="text-[10px] block mt-0.5 text-slate-500">(60% &times; {selectedResult.kepribadian.ncf.toFixed(2)}) + (40% &times; {selectedResult.kepribadian.nsf.toFixed(2)})</span>
                        <span className="text-base font-black text-slate-900 block mt-1">
                          = {selectedResult.kepribadian.total.toFixed(3)}
                        </span>
                      </div>
                    </div>

                    {/* Tanggung Jawab Breakdown */}
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3 font-sans">
                      <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider block">3. TANGGUNG JAWAB (TJ)</span>
                      
                      <div className="space-y-1.5 text-xs text-slate-600 font-mono">
                        <div className="flex justify-between">
                          <span>Core (Target):</span>
                          <span className="font-bold text-slate-900">
                            {selectedResult.weights.pencapaianTarget.toFixed(1)} / 1 = {selectedResult.tanggungJawab.ncf.toFixed(2)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Secondary (Teli):</span>
                          <span className="font-bold text-slate-900">
                            {selectedResult.weights.ketelitian.toFixed(1)} / 1 = {selectedResult.tanggungJawab.nsf.toFixed(2)}
                          </span>
                        </div>
                      </div>

                      <div className="bg-white p-2.5 rounded border border-slate-200 text-xs font-mono">
                        <span className="text-[9px] text-slate-400 block font-sans">TOTAL SKOR TJ</span>
                        <span className="text-[10px] block mt-0.5 text-slate-500">(60% &times; {selectedResult.tanggungJawab.ncf.toFixed(2)}) + (40% &times; {selectedResult.tanggungJawab.nsf.toFixed(2)})</span>
                        <span className="text-base font-black text-slate-900 block mt-1">
                          = {selectedResult.tanggungJawab.total.toFixed(3)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Side Summary Result Box */}
              <div className="space-y-6">
                
                {/* Score Target Box */}
                <div className="bg-slate-900 text-white rounded-xl p-6 shadow-sm space-y-6">
                  <div>
                    <span className="text-[10px] tracking-wider font-mono text-blue-400 uppercase font-semibold block">HASIL EVALUASI AUDIT</span>
                    <h4 className="text-base font-bold text-white mt-1">{selectedCandidate.name}</h4>
                    <span className="text-xs text-slate-400 font-medium block">{selectedCandidate.role} &middot; {selectedCandidate.department}</span>
                  </div>

                  <div className="border-t border-slate-800 pt-5 space-y-4 font-mono text-xs">
                    <div>
                      <div className="flex justify-between mb-1 text-slate-400">
                        <span>Sikap Kerja (35%):</span>
                        <span className="text-white font-bold">{selectedResult.sikapKerja.total.toFixed(3)}</span>
                      </div>
                      <div className="w-full bg-slate-800 rounded-full h-1.5">
                        <div className="bg-blue-500 h-1.5 rounded-full" style={{ width: `${(selectedResult.sikapKerja.total / 5) * 100}%` }}></div>
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between mb-1 text-slate-400">
                        <span>Kepribadian (30%):</span>
                        <span className="text-white font-bold">{selectedResult.kepribadian.total.toFixed(3)}</span>
                      </div>
                      <div className="w-full bg-slate-800 rounded-full h-1.5">
                        <div className="bg-indigo-500 h-1.5 rounded-full" style={{ width: `${(selectedResult.kepribadian.total / 5) * 100}%` }}></div>
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between mb-1 text-slate-400">
                        <span>Tanggung Jawab (35%):</span>
                        <span className="text-white font-bold">{selectedResult.tanggungJawab.total.toFixed(3)}</span>
                      </div>
                      <div className="w-full bg-slate-800 rounded-full h-1.5">
                        <div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: `${(selectedResult.tanggungJawab.total / 5) * 100}%` }}></div>
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-slate-800 pt-5 text-center">
                    <span className="text-[9px] text-slate-400 tracking-wider block font-sans">SKOR EVALUASI AKHIR (RANK SCORE)</span>
                    <span className="text-4xl font-black text-blue-400 tracking-tight font-mono block mt-1.5">
                      {selectedResult.finalScore.toFixed(3)}
                    </span>
                    
                    <div className="mt-4">
                      <span className={`inline-block px-3 py-1 text-xs font-bold rounded border ${getRecommendationBadge(selectedResult.finalScore).bg}`}>
                        {getRecommendationBadge(selectedResult.finalScore).text}
                      </span>
                    </div>

                    <p className="text-[10px] text-slate-400 mt-3 font-sans italic leading-relaxed">
                      &ldquo;{getRecommendationBadge(selectedResult.finalScore).desc}&rdquo;
                    </p>
                  </div>
                </div>

                {/* Audit Checklist Status */}
                <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-3">
                  <span className="text-xs font-bold text-slate-900 block">Status Validasi Keputusan</span>
                  <div className="space-y-2.5 text-xs text-slate-600">
                    <div className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span>Data identitas & departemen lengkap.</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span>Input nilai lengkap 8 sub-kriteria (skala 1-5).</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span>Bobot aspek terverifikasi 35% / 30% / 35%.</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span>Standardisasi profile matching tersinkronisasi dinamis.</span>
                    </div>
                  </div>
                </div>

              </div>

            </div>
          </div>
        )}

        {/* ==========================================
            VIEW: 4. DETAILED RANKING BOARD & DECISIONS
            ========================================== */}
        {activeTab === 'rankings' && !isAddingCandidate && (
          <div className="space-y-8 animate-in fade-in duration-300">
            
            {/* Title & Promotion Summary */}
            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">Rekomendasi Keputusan & Promosi Jabatan</h3>
                <p className="text-xs text-slate-500">Hasil perangkingan otomatis berdasarkan regulasi pembobotan PT Jaya Prima Plastik.</p>
              </div>

              <button
                onClick={exportSummaryData}
                className="flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors border border-slate-200"
              >
                <Download className="w-4 h-4" />
                <span>Unduh Laporan Keputusan (.TXT)</span>
              </button>
            </div>

            {/* Recommendation Categories Box */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* Category 1: Promosi Segera */}
              <div className="bg-emerald-50/50 border border-emerald-200 rounded-xl p-5 space-y-4 shadow-2xs">
                <div className="flex items-center justify-between border-b border-emerald-200 pb-2.5">
                  <h4 className="text-xs font-bold text-emerald-800 uppercase tracking-wider">Promosi Utama (Skor &ge; 3.8)</h4>
                  <span className="font-mono font-bold text-emerald-700 text-xs">
                    {rankedCandidates.filter(c => c.finalScore >= 3.8).length} Orang
                  </span>
                </div>

                <div className="space-y-3">
                  {rankedCandidates.filter(c => c.finalScore >= 3.8).map(c => (
                    <div key={c.id} className="bg-white p-3 rounded-lg border border-emerald-100 flex justify-between items-center">
                      <div>
                        <span className="font-bold text-slate-900 block text-xs">{c.name}</span>
                        <span className="text-[10px] text-slate-500 block">{c.role}</span>
                      </div>
                      <span className="text-xs font-black text-emerald-700 font-mono">{c.finalScore.toFixed(3)}</span>
                    </div>
                  ))}
                  {rankedCandidates.filter(c => c.finalScore >= 3.8).length === 0 && (
                    <p className="text-xs text-slate-400 italic text-center py-2">Belum ada kandidat memenuhi standar tinggi.</p>
                  )}
                </div>
              </div>

              {/* Category 2: Promosi Cadangan */}
              <div className="bg-blue-50/50 border border-blue-200 rounded-xl p-5 space-y-4 shadow-2xs">
                <div className="flex items-center justify-between border-b border-blue-200 pb-2.5">
                  <h4 className="text-xs font-bold text-blue-800 uppercase tracking-wider">Promosi Cadangan (3.2 - 3.79)</h4>
                  <span className="font-mono font-bold text-blue-700 text-xs">
                    {rankedCandidates.filter(c => c.finalScore >= 3.2 && c.finalScore < 3.8).length} Orang
                  </span>
                </div>

                <div className="space-y-3">
                  {rankedCandidates.filter(c => c.finalScore >= 3.2 && c.finalScore < 3.8).map(c => (
                    <div key={c.id} className="bg-white p-3 rounded-lg border border-blue-100 flex justify-between items-center">
                      <div>
                        <span className="font-bold text-slate-900 block text-xs">{c.name}</span>
                        <span className="text-[10px] text-slate-500 block">{c.role}</span>
                      </div>
                      <span className="text-xs font-black text-blue-700 font-mono">{c.finalScore.toFixed(3)}</span>
                    </div>
                  ))}
                  {rankedCandidates.filter(c => c.finalScore >= 3.2 && c.finalScore < 3.8).length === 0 && (
                    <p className="text-xs text-slate-400 italic text-center py-2">Belum ada kandidat di kategori cadangan.</p>
                  )}
                </div>
              </div>

              {/* Category 3: Pertahankan Posisi */}
              <div className="bg-slate-100/50 border border-slate-300 rounded-xl p-5 space-y-4 shadow-2xs">
                <div className="flex items-center justify-between border-b border-slate-300 pb-2.5">
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Pertahankan Posisi (&lt; 3.2)</h4>
                  <span className="font-mono font-bold text-slate-600 text-xs">
                    {rankedCandidates.filter(c => c.finalScore < 3.2).length} Orang
                  </span>
                </div>

                <div className="space-y-3">
                  {rankedCandidates.filter(c => c.finalScore < 3.2).map(c => (
                    <div key={c.id} className="bg-white p-3 rounded-lg border border-slate-200 flex justify-between items-center">
                      <div>
                        <span className="font-bold text-slate-900 block text-xs">{c.name}</span>
                        <span className="text-[10px] text-slate-500 block">{c.role}</span>
                      </div>
                      <span className="text-xs font-black text-slate-600 font-mono">{c.finalScore.toFixed(3)}</span>
                    </div>
                  ))}
                  {rankedCandidates.filter(c => c.finalScore < 3.2).length === 0 && (
                    <p className="text-xs text-slate-400 italic text-center py-2">Seluruh kandidat lolos promosi.</p>
                  )}
                </div>
              </div>

            </div>

            {/* Comprehensive SPK Dashboard Sheet View */}
            <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
              <div className="px-6 py-5 border-b border-slate-100">
                <h3 className="text-base font-bold text-slate-900">Rekapitulasi Semua Matriks & Keputusan Akhir</h3>
                <p className="text-xs text-slate-500">Lembar kerja komprehensif memuat seluruh variabel perhitungan Profile Matching.</p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse font-mono">
                  <thead>
                    <tr className="bg-slate-900 text-white uppercase text-[10px] font-bold">
                      <th className="py-3 px-4 font-sans text-left">Nama</th>
                      <th className="py-3 px-3 text-center">N_SK (35%)</th>
                      <th className="py-3 px-3 text-center">N_KP (30%)</th>
                      <th className="py-3 px-3 text-center">N_TJ (35%)</th>
                      <th className="py-3 px-3 text-center">SKOR TOTAL</th>
                      <th className="py-3 px-3 text-center font-sans">STATUS PROMOSI</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 text-slate-700">
                    {rankedCandidates.map((cand) => {
                      const rec = getRecommendationBadge(cand.finalScore);

                      return (
                        <tr key={cand.id} className="hover:bg-slate-50">
                          <td className="py-3.5 px-4 font-sans">
                            <span className="font-bold text-slate-900 block">{cand.name}</span>
                            <span className="text-[9px] text-slate-400 block">{cand.role}</span>
                          </td>
                          <td className="py-3.5 px-3 text-center">
                            {cand.calculations.sikapKerja.total.toFixed(3)}
                          </td>
                          <td className="py-3.5 px-3 text-center">
                            {cand.calculations.kepribadian.total.toFixed(3)}
                          </td>
                          <td className="py-3.5 px-3 text-center">
                            {cand.calculations.tanggungJawab.total.toFixed(3)}
                          </td>
                          <td className="py-3.5 px-3 text-center font-extrabold text-blue-700 bg-blue-50/10">
                            {cand.finalScore.toFixed(3)}
                          </td>
                          <td className="py-3.5 px-3 text-center whitespace-nowrap font-sans">
                            <span className={`inline-block px-2.5 py-0.5 text-[9px] font-bold rounded-full border ${rec.bg}`}>
                              {rec.text}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Methodology Note */}
            <div className="bg-slate-900 text-slate-300 rounded-xl p-6 border border-slate-800 space-y-3">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-blue-400 shrink-0" />
                <h4 className="text-sm font-bold text-white">Catatan Metodologi Profile Matching PT Jaya Prima Plastik</h4>
              </div>
              <p className="text-xs leading-relaxed">
                Profile Matching merupakan mekanisme penentuan keputusan dengan mengasumsikan terdapat tingkat kompetensi standar ideal yang harus dipenuhi oleh karyawan, bukan tingkat kompetensi minimal melainkan tingkat kompetensi yang optimal. 
                Dengan menghitung selisih (GAP) antara kompetensi nyata dengan target standar, diperoleh gambaran kecocokan profil secara akurat. Pembobotan GAP bernilai positif menunjukkan kelebihan kompetensi yang dinilai baik sebagai keunggulan kompetitif, sedangkan GAP negatif menunjukkan defisit kompetensi yang memerlukan pembinaan atau diklat intensif.
              </p>
            </div>

          </div>
        )}

      </main>

      {/* ==========================================
          FOOTER
          ========================================== */}
      <footer className="bg-slate-900 text-slate-400 py-6 border-t border-slate-800 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-2">
          <p className="text-xs">
            &copy; 2026 PT Jaya Prima Plastik. Hak Cipta Dilindungi Undang-Undang.
          </p>
          <div className="flex justify-center gap-4 text-[11px] text-slate-500">
            <span>Sistem Pendukung Keputusan (SPK)</span>
            <span>&middot;</span>
            <span>Profile Matching Method v2.4</span>
            <span>&middot;</span>
            <span>HR Evaluation System</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
