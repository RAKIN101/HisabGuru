"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Wallet, Plus, X, Trash2, Edit2, CreditCard, Banknote, Building2, Smartphone } from "lucide-react";
import { useAudioFeedback, useInputAudio } from "@/lib/useAudioFeedback";
import { getAccounts, initializeAccounts, recalculateAllAccountBalances } from "@/lib/store";
import type { AccountBalance } from "@/lib/store";

export default function Accounts() {
  const [accounts, setAccounts] = useState<AccountBalance[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingAccount, setEditingAccount] = useState<AccountBalance | null>(null);
  const [newAccountName, setNewAccountName] = useState("");
  const [newAccountBalance, setNewAccountBalance] = useState("");
  const [newAccountIcon, setNewAccountIcon] = useState("💳");
  
  const playSound = useAudioFeedback();
  const handleInputKeyDown = useInputAudio();

  useEffect(() => {
    loadAccounts();
    // Recalculate balances on mount to ensure consistency
    recalculateAllAccountBalances();
  }, []);

  const loadAccounts = () => {
    if (typeof window === "undefined") return;
    
    initializeAccounts();
    const accountsList = getAccounts();
    setAccounts(accountsList);
  };

  const saveAccounts = (newAccounts: AccountBalance[]) => {
    if (typeof window === "undefined") return;
    localStorage.setItem("hisabguru_accounts", JSON.stringify(newAccounts));
    setAccounts(newAccounts);
  };

  const handleAddAccount = () => {
    if (!newAccountName.trim()) return;
    
    const newAccount: AccountBalance = {
      id: `custom_${Date.now()}`,
      name: newAccountName.trim(),
      balance: parseFloat(newAccountBalance) || 0,
      type: "custom",
      icon: newAccountIcon,
    };

    const updatedAccounts = [...accounts, newAccount];
    saveAccounts(updatedAccounts);
    
    setNewAccountName("");
    setNewAccountBalance("");
    setNewAccountIcon("💳");
    setShowAddModal(false);
    playSound('success');
  };

  const handleEditAccount = () => {
    if (!editingAccount || !newAccountName.trim()) return;
    
    const updatedAccounts = accounts.map(acc => 
      acc.id === editingAccount.id 
        ? { 
            ...acc, 
            name: newAccountName.trim(),
            balance: parseFloat(newAccountBalance) || acc.balance,
            icon: newAccountIcon
          }
        : acc
    );
    
    saveAccounts(updatedAccounts);
    
    setEditingAccount(null);
    setNewAccountName("");
    setNewAccountBalance("");
    setNewAccountIcon("💳");
    setShowEditModal(false);
    playSound('success');
  };

  const handleDeleteAccount = (accountId: string) => {
    if (confirm("Are you sure you want to delete this account?")) {
      const updatedAccounts = accounts.filter(acc => acc.id !== accountId);
      saveAccounts(updatedAccounts);
      playSound('delete');
    }
  };

  const openEditModal = (account: AccountBalance) => {
    setEditingAccount(account);
    setNewAccountName(account.name);
    setNewAccountBalance(account.balance.toString());
    setNewAccountIcon(account.icon);
    setShowEditModal(true);
  };

  const totalBalance = accounts.reduce((sum, acc) => sum + acc.balance, 0);

  const accountIcons = {
    cash: Banknote,
    mobile: Smartphone,
    bank: Building2,
    custom: CreditCard
  };

  const commonEmojis = ["💵", "💳", "💰", "🏦", "📱", "📲", "🚀", "💎", "🏧", "💼", "👛", "🪙", "💶", "💷", "💴", "🏪"];

  return (
    <div className="space-y-5 py-5">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h2 className="text-2xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
          Accounts
        </h2>
        <p className="text-sm text-gray-500 mt-1">Manage your accounts and balances</p>
      </motion.div>

      {/* Total Balance Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-teal-50 to-cyan-50 p-6 shadow-lg border border-white/50"
      >
        <div className="absolute -top-6 -right-6 h-24 w-24 rounded-full bg-gradient-to-br from-teal-500 to-cyan-600 opacity-20" />
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Total Balance</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">৳{totalBalance.toLocaleString()}</p>
          </div>
          <div className="rounded-xl bg-gradient-to-br from-teal-500 to-cyan-600 p-4 shadow-lg">
            <Wallet className="h-8 w-8 text-white" strokeWidth={2.5} />
          </div>
        </div>
      </motion.div>

      {/* Accounts List */}
      <div className="space-y-3">
        {accounts.length === 0 ? (
          <div className="glass-card rounded-2xl p-8 text-center">
            <p className="text-sm text-gray-500">No accounts yet. Add your first account!</p>
          </div>
        ) : (
          accounts.map((account, idx) => {
            const IconComponent = accountIcons[account.type];
            return (
              <motion.div
                key={account.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="glass-card rounded-xl p-4 hover:shadow-xl transition-all group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-xl bg-gradient-to-br from-teal-100 to-cyan-100">
                      <span className="text-2xl">{account.icon}</span>
                    </div>
                    <div>
                      <p className="text-base font-bold text-gray-800">{account.name}</p>
                      <p className="text-xs text-gray-500 capitalize">{account.type} Account</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="text-lg font-bold text-gray-900">৳{account.balance.toLocaleString()}</p>
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => openEditModal(account)}
                        className="p-2 rounded-lg hover:bg-blue-50 transition-colors"
                        title="Edit"
                      >
                        <Edit2 className="h-4 w-4 text-blue-600" />
                      </button>
                      {account.type === "custom" && (
                        <button
                          onClick={() => handleDeleteAccount(account.id)}
                          className="p-2 rounded-lg hover:bg-red-50 transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })
        )}
      </div>

      {/* Floating Add Button */}
      <motion.button
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => { setShowAddModal(true); playSound('tap'); }}
        className="fixed bottom-24 right-4 md:right-[calc(50%-12rem)] z-40 flex h-14 w-14 items-center justify-center rounded-full gradient-teal shadow-2xl hover:shadow-3xl transition-all"
      >
        <Plus className="h-7 w-7 text-white" strokeWidth={3} />
      </motion.button>

      {/* Add Account Modal */}
      <AnimatePresence>
        {showAddModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAddModal(false)}
              className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="fixed inset-x-4 top-1/2 -translate-y-1/2 z-50 mx-auto max-w-md glass-card rounded-2xl p-6 shadow-2xl"
            >
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-lg font-bold text-gray-800">Add New Account</h3>
                <button onClick={() => setShowAddModal(false)} className="rounded-lg p-1 hover:bg-gray-100">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="mb-2 block text-xs font-bold text-gray-700 uppercase tracking-wide">
                    Account Name
                  </label>
                  <input
                    type="text"
                    value={newAccountName}
                    onChange={(e) => setNewAccountName(e.target.value)}
                    onKeyDown={handleInputKeyDown}
                    className="w-full rounded-xl border-2 border-gray-200 bg-white p-3 text-sm font-medium focus:border-teal-500 focus:outline-none"
                    placeholder="e.g., Dutch Bangla Bank"
                    autoFocus
                  />
                </div>

                <div>
                  <label className="mb-2 block text-xs font-bold text-gray-700 uppercase tracking-wide">
                    Initial Balance (৳)
                  </label>
                  <input
                    type="number"
                    value={newAccountBalance}
                    onChange={(e) => setNewAccountBalance(e.target.value)}
                    onKeyDown={handleInputKeyDown}
                    className="w-full rounded-xl border-2 border-gray-200 bg-white p-3 text-sm font-medium focus:border-teal-500 focus:outline-none"
                    placeholder="0"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-xs font-bold text-gray-700 uppercase tracking-wide">
                    Choose Icon
                  </label>
                  <div className="grid grid-cols-8 gap-2 mb-3">
                    {commonEmojis.map((emoji) => (
                      <button
                        key={emoji}
                        onClick={() => setNewAccountIcon(emoji)}
                        className={`flex h-10 w-10 items-center justify-center rounded-lg text-lg transition-colors ${
                          newAccountIcon === emoji 
                            ? "bg-teal-100 ring-2 ring-teal-500" 
                            : "bg-gray-100 hover:bg-teal-50"
                        }`}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                  <input
                    type="text"
                    value={newAccountIcon}
                    onChange={(e) => setNewAccountIcon(e.target.value)}
                    className="w-full rounded-xl border-2 border-gray-200 bg-white p-3 text-sm font-medium focus:border-teal-500 focus:outline-none"
                    placeholder="Or enter custom emoji"
                  />
                </div>

                <motion.button
                  onClick={handleAddAccount}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full rounded-xl gradient-teal py-3 text-sm font-bold text-white shadow-lg"
                >
                  Add Account
                </motion.button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Edit Account Modal */}
      <AnimatePresence>
        {showEditModal && editingAccount && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowEditModal(false)}
              className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="fixed inset-x-4 top-1/2 -translate-y-1/2 z-50 mx-auto max-w-md glass-card rounded-2xl p-6 shadow-2xl"
            >
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-lg font-bold text-gray-800">Edit Account</h3>
                <button onClick={() => setShowEditModal(false)} className="rounded-lg p-1 hover:bg-gray-100">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="mb-2 block text-xs font-bold text-gray-700 uppercase tracking-wide">
                    Account Name
                  </label>
                  <input
                    type="text"
                    value={newAccountName}
                    onChange={(e) => setNewAccountName(e.target.value)}
                    onKeyDown={handleInputKeyDown}
                    className="w-full rounded-xl border-2 border-gray-200 bg-white p-3 text-sm font-medium focus:border-teal-500 focus:outline-none"
                    placeholder="Account name"
                    autoFocus
                  />
                </div>

                <div>
                  <label className="mb-2 block text-xs font-bold text-gray-700 uppercase tracking-wide">
                    Balance (৳)
                  </label>
                  <input
                    type="number"
                    value={newAccountBalance}
                    onChange={(e) => setNewAccountBalance(e.target.value)}
                    onKeyDown={handleInputKeyDown}
                    className="w-full rounded-xl border-2 border-gray-200 bg-white p-3 text-sm font-medium focus:border-teal-500 focus:outline-none"
                    placeholder="0"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-xs font-bold text-gray-700 uppercase tracking-wide">
                    Choose Icon
                  </label>
                  <div className="grid grid-cols-8 gap-2 mb-3">
                    {commonEmojis.map((emoji) => (
                      <button
                        key={emoji}
                        onClick={() => setNewAccountIcon(emoji)}
                        className={`flex h-10 w-10 items-center justify-center rounded-lg text-lg transition-colors ${
                          newAccountIcon === emoji 
                            ? "bg-teal-100 ring-2 ring-teal-500" 
                            : "bg-gray-100 hover:bg-teal-50"
                        }`}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                  <input
                    type="text"
                    value={newAccountIcon}
                    onChange={(e) => setNewAccountIcon(e.target.value)}
                    className="w-full rounded-xl border-2 border-gray-200 bg-white p-3 text-sm font-medium focus:border-teal-500 focus:outline-none"
                    placeholder="Or enter custom emoji"
                  />
                </div>

                <motion.button
                  onClick={handleEditAccount}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full rounded-xl gradient-teal py-3 text-sm font-bold text-white shadow-lg"
                >
                  Save Changes
                </motion.button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
