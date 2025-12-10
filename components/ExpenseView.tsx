import React, { useState, useMemo, useEffect } from 'react';
import { Expense, User } from '../types';
import { Plus, DollarSign, Wallet, ArrowRight, Trash2, RefreshCw, UserCog, Check, X, ClipboardList, CheckSquare, Square } from 'lucide-react';
import { addExpenseItem, addUser, deleteExpenseItem, updateUser, deleteUser } from '../services/firebaseService';

interface Props {
  expenses: Expense[];
  users: User[];
}

const ExpenseView: React.FC<Props> = ({ expenses, users }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSettlementOpen, setIsSettlementOpen] = useState(false);
  
  // Expense Form State
  const [newExpense, setNewExpense] = useState<Partial<Expense>>({ amount: 0, payer: '' });
  const [selectedInvolved, setSelectedInvolved] = useState<string[]>([]); // New: Track who splits the bill

  const [newUser, setNewUser] = useState('');
  
  // User Management State
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [editingName, setEditingName] = useState('');
  
  // Currency Converter State
  const [converterAmount, setConverterAmount] = useState<string>('');
  const [exchangeRate, setExchangeRate] = useState(0.024); // Rough KRW to TWD
  
  const convertedValue = converterAmount ? (parseFloat(converterAmount) * exchangeRate).toFixed(0) : '0';

  // Initialize payer and involved when modal opens or users change
  useEffect(() => {
     if (users.length > 0) {
         if (!newExpense.payer) setNewExpense(prev => ({ ...prev, payer: users[0].name }));
         // Default to all involved
         if (selectedInvolved.length === 0) setSelectedInvolved(users.map(u => u.name));
     }
  }, [users.length, isModalOpen]);

  // Calculations
  const calculations = useMemo(() => {
    if (users.length === 0) return { debts: [], balances: {}, totalPaid: {} };
    
    const balances: Record<string, number> = {};
    const totalPaid: Record<string, number> = {}; // Total amount each person actually paid out
    const totalShare: Record<string, number> = {}; // Total value each person consumed

    users.forEach(u => {
        balances[u.name] = 0;
        totalPaid[u.name] = 0;
        totalShare[u.name] = 0;
    });

    expenses.forEach(exp => {
      const paidBy = exp.payer;
      const amount = exp.amount;
      const splitAmong = exp.involved || users.map(u => u.name); // Fallback for old data
      
      const share = amount / splitAmong.length;

      // Track stats
      if (totalPaid[paidBy] !== undefined) totalPaid[paidBy] += amount;

      // Update Balances
      if (balances[paidBy] !== undefined) balances[paidBy] += amount; // Payer gets credit
      
      splitAmong.forEach(person => {
        // Only deduct if person exists in current user list
        if (balances[person] !== undefined) {
             balances[person] -= share;
             totalShare[person] += share;
        }
      });
    });

    // Simplify Debts
    const result = [];
    let debtors = Object.entries(balances).filter(([_, val]) => val < -0.01).sort((a, b) => a[1] - b[1]);
    let creditors = Object.entries(balances).filter(([_, val]) => val > 0.01).sort((a, b) => b[1] - a[1]);

    let i = 0; 
    let j = 0;

    while (i < debtors.length && j < creditors.length) {
      const debtor = debtors[i];
      const creditor = creditors[j];
      const amount = Math.min(Math.abs(debtor[1]), creditor[1]);
      
      result.push({
        from: debtor[0],
        to: creditor[0],
        amount: Math.round(amount)
      });

      debtors[i] = [debtor[0], debtor[1] + amount];
      creditors[j] = [creditor[0], creditor[1] - amount];

      if (Math.abs(debtors[i][1]) < 0.01) i++;
      if (creditors[j][1] < 0.01) j++;
    }

    return { debts: result, balances, totalPaid, totalShare };
  }, [expenses, users]);

  const totalSpent = expenses.reduce((acc, curr) => acc + curr.amount, 0);

  const handleAddUser = async () => {
    if (newUser && !users.find(u => u.name === newUser)) {
      await addUser(newUser);
      setNewUser('');
    }
  };

  const handleUserClick = (user: User) => {
      setSelectedUser(user);
      setEditingName(user.name);
  };

  const handleUpdateUser = async () => {
      if (selectedUser && editingName.trim()) {
          await updateUser(selectedUser.id, editingName);
          setSelectedUser(null);
      }
  };

  const handleDeleteUser = async () => {
      if (selectedUser) {
          if (confirm(`Are you sure you want to delete ${selectedUser.name}? This might affect debt calculations.`)) {
              await deleteUser(selectedUser.id);
              setSelectedUser(null);
          }
      }
  };

  const toggleInvolved = (name: string) => {
      setSelectedInvolved(prev => 
        prev.includes(name) ? prev.filter(n => n !== name) : [...prev, name]
      );
  };

  const handleAddExpense = async () => {
    if (newExpense.amount && newExpense.description && newExpense.payer && selectedInvolved.length > 0) {
      await addExpenseItem({
        amount: Number(newExpense.amount),
        description: newExpense.description!,
        payer: newExpense.payer!,
        date: new Date().toISOString(),
        involved: selectedInvolved
      });
      setIsModalOpen(false);
      setNewExpense({ amount: 0, payer: users[0]?.name });
      setSelectedInvolved(users.map(u => u.name)); // Reset to all
    } else if (selectedInvolved.length === 0) {
        alert("Please select at least one person to split the bill.");
    }
  };

  const handleDeleteExpense = async (id: string) => {
    await deleteExpenseItem(id);
  };

  return (
    <div className="h-full overflow-y-auto p-5 pb-24 space-y-6 no-scrollbar">
      
      {/* Currency Converter Widget */}
      <div className="bg-white rounded-3xl p-5 shadow-sm border border-sand">
        <div className="flex items-center justify-between mb-3 text-latte text-xs font-bold uppercase tracking-wider">
           <span>Quick Convert</span>
           <span className="flex items-center"><RefreshCw size={10} className="mr-1"/> 1 KRW ≈ {exchangeRate} TWD</span>
        </div>
        <div className="flex items-center gap-4">
           <div className="flex-1">
             <div className="text-xs text-gray-400 mb-1">KRW (₩)</div>
             <input 
                type="number" 
                value={converterAmount}
                onChange={(e) => setConverterAmount(e.target.value)}
                placeholder="1000"
                className="w-full bg-cream p-2 rounded-xl font-bold text-cocoa text-lg focus:outline-none focus:ring-1 focus:ring-cocoa transition-all"
             />
           </div>
           <ArrowRight className="text-sand" />
           <div className="flex-1">
             <div className="text-xs text-gray-400 mb-1">TWD ($)</div>
             <div className="w-full bg-cocoa p-2 rounded-xl font-bold text-white text-lg flex items-center h-[44px]">
                {Number(convertedValue).toLocaleString()}
             </div>
           </div>
        </div>
      </div>

      {/* Summary Card */}
      <div className="bg-gradient-to-br from-cocoa to-[#4E342E] rounded-[2rem] p-6 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-5 rounded-full -mr-10 -mt-10"></div>
        
        <div className="flex justify-between items-start">
            <div>
                <p className="text-sand text-sm font-medium mb-1 opacity-80">Total Trip Spending</p>
                <h2 className="text-4xl font-serif font-bold tracking-tight">₩ {totalSpent.toLocaleString()}</h2>
            </div>
            <button 
                onClick={() => setIsSettlementOpen(true)}
                className="bg-white/10 hover:bg-white/20 p-2 rounded-xl backdrop-blur-sm transition-colors"
                title="View Settlement Report"
            >
                <ClipboardList size={20} className="text-sand" />
            </button>
        </div>

        <div className="mt-6 flex items-center justify-between">
            <div className="flex -space-x-2 overflow-x-auto no-scrollbar max-w-[70%]">
            {users.map((u, i) => (
                <button 
                  key={u.id} 
                  onClick={() => handleUserClick(u)}
                  className="w-8 h-8 rounded-full bg-latte border-2 border-cocoa flex items-center justify-center text-xs font-bold uppercase text-white shadow-md hover:scale-110 transition-transform flex-shrink-0"
                >
                  {u.name.charAt(0)}
                </button>
            ))}
            </div>
            
            <div className="flex bg-white/10 rounded-full p-1 pl-3 items-center backdrop-blur-sm ml-2">
                <input 
                    className="bg-transparent text-white text-xs w-16 focus:outline-none placeholder-white/50"
                    placeholder="New..."
                    value={newUser}
                    onChange={e => setNewUser(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleAddUser()}
                />
                <button onClick={handleAddUser} className="bg-white text-cocoa rounded-full p-1"><Plus size={12} /></button>
            </div>
        </div>
      </div>

      {/* Who owes who (Simplified) */}
      {calculations.debts.length > 0 && (
        <div className="bg-white rounded-3xl p-5 shadow-[0_4px_20px_rgba(0,0,0,0.03)]">
           <h3 className="text-cocoa font-bold mb-4 flex items-center text-sm uppercase tracking-wide">
             <Wallet className="mr-2 text-latte" size={16}/> Settlements needed
           </h3>
           <div className="space-y-3">
             {calculations.debts.map((d, i) => (
               <div key={i} className="flex items-center justify-between p-3 bg-cream rounded-xl border border-sand/50">
                 <div className="flex items-center gap-2">
                   <span className="font-bold text-cocoa">{d.from}</span>
                   <ArrowRight size={14} className="text-latte" />
                   <span className="font-bold text-cocoa">{d.to}</span>
                 </div>
                 <span className="font-bold text-accent">₩ {d.amount.toLocaleString()}</span>
               </div>
             ))}
           </div>
        </div>
      )}

      {/* Expense List */}
      <div className="space-y-4">
        <h3 className="text-cocoa font-bold ml-1 text-sm uppercase tracking-wide">Recent Expenses</h3>
        {expenses.length === 0 ? (
            <div className="text-center py-8 text-gray-400 bg-white rounded-3xl border border-dashed border-sand">No expenses recorded.</div>
        ) : (
            expenses.map(expense => (
                <div key={expense.id} className="bg-white p-4 rounded-2xl shadow-sm flex items-center justify-between border border-transparent hover:border-sand transition-all">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-cream flex items-center justify-center text-cocoa border border-sand">
                            <DollarSign size={18} />
                        </div>
                        <div>
                            <p className="font-bold text-cocoa text-sm">{expense.description}</p>
                            <div className="flex items-center text-[10px] text-latte gap-2">
                                <span className="uppercase font-bold tracking-wider">{expense.payer} Paid</span>
                                {expense.involved && expense.involved.length < users.length && (
                                    <span className="bg-sand/30 px-1.5 rounded text-cocoa/60">
                                        Splitting: {expense.involved.length} ppl
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className="font-bold text-cocoa">₩ {expense.amount.toLocaleString()}</span>
                        <button onClick={() => handleDeleteExpense(expense.id)} className="text-sand hover:text-red-400">
                            <Trash2 size={16} />
                        </button>
                    </div>
                </div>
            ))
        )}
      </div>

       {/* FAB */}
       <button
        onClick={() => setIsModalOpen(true)}
        className="fixed bottom-24 right-6 w-14 h-14 bg-cocoa text-white rounded-full shadow-2xl flex items-center justify-center hover:bg-latte transition-transform z-20"
      >
        <Plus size={28} />
      </button>

      {/* Add Expense Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-cocoa/30 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-[2rem] w-full max-w-sm p-6 shadow-2xl animate-[float_0.3s_ease-out] max-h-[80vh] overflow-y-auto no-scrollbar">
            <h2 className="text-xl font-serif font-bold text-cocoa mb-6 text-center">Add Expense</h2>
            <div className="space-y-6">
               <div className="text-center">
                  <label className="text-[10px] font-bold text-latte uppercase tracking-widest">Amount (KRW)</label>
                  <input type="number" 
                    className="w-full text-4xl font-serif font-bold p-2 border-b border-sand focus:border-cocoa focus:outline-none bg-transparent text-center text-cocoa placeholder-sand"
                    placeholder="0"
                    value={newExpense.amount || ''}
                    onChange={e => setNewExpense({...newExpense, amount: Number(e.target.value)})}
                  />
               </div>
               <div>
                 <label className="text-xs font-bold text-latte uppercase">Description</label>
                 <input type="text" 
                    className="w-full p-3 bg-cream rounded-xl mt-2 text-cocoa focus:outline-none focus:ring-1 focus:ring-cocoa"
                    placeholder="Dinner, Taxi..."
                    value={newExpense.description || ''}
                    onChange={e => setNewExpense({...newExpense, description: e.target.value})}
                 />
               </div>
               
               {/* Payer Selection */}
               <div>
                 <label className="text-xs font-bold text-latte uppercase">Who Paid?</label>
                 <div className="flex flex-wrap gap-2 mt-2">
                    {users.map(u => (
                        <button 
                            key={u.id}
                            onClick={() => setNewExpense({...newExpense, payer: u.name})}
                            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                                newExpense.payer === u.name 
                                ? 'bg-cocoa text-white shadow-md' 
                                : 'bg-cream text-gray-500 hover:bg-sand'
                            }`}
                        >
                            {u.name}
                        </button>
                    ))}
                 </div>
               </div>

               {/* Involved Selection */}
               <div>
                 <div className="flex justify-between items-center">
                     <label className="text-xs font-bold text-latte uppercase">Split With</label>
                     <button 
                        onClick={() => setSelectedInvolved(selectedInvolved.length === users.length ? [] : users.map(u => u.name))}
                        className="text-[10px] text-accent font-bold"
                     >
                        {selectedInvolved.length === users.length ? 'Deselect All' : 'Select All'}
                     </button>
                 </div>
                 <div className="grid grid-cols-2 gap-2 mt-2">
                    {users.map(u => (
                        <button 
                            key={`inv-${u.id}`}
                            onClick={() => toggleInvolved(u.name)}
                            className={`flex items-center p-2 rounded-xl text-sm font-bold transition-all border ${
                                selectedInvolved.includes(u.name)
                                ? 'bg-cream border-cocoa text-cocoa' 
                                : 'bg-white border-sand text-gray-300'
                            }`}
                        >
                            {selectedInvolved.includes(u.name) 
                                ? <CheckSquare size={16} className="mr-2 text-cocoa"/> 
                                : <Square size={16} className="mr-2"/>
                            }
                            {u.name}
                        </button>
                    ))}
                 </div>
               </div>
            </div>
            <div className="flex gap-3 mt-8">
              <button onClick={() => setIsModalOpen(false)} className="flex-1 py-3 text-latte font-bold hover:bg-cream rounded-xl transition-colors">Cancel</button>
              <button onClick={handleAddExpense} className="flex-1 py-3 bg-accent text-white rounded-xl font-bold shadow-lg hover:bg-orange-600 transition-colors">Save</button>
            </div>
          </div>
        </div>
      )}

      {/* Settlement Modal */}
      {isSettlementOpen && (
        <div className="fixed inset-0 bg-cocoa/40 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-white rounded-[2rem] w-full max-w-sm p-6 shadow-2xl animate-[float_0.3s_ease-out] max-h-[90vh] overflow-y-auto no-scrollbar relative">
                <button 
                    onClick={() => setIsSettlementOpen(false)}
                    className="absolute top-4 right-4 text-gray-400 hover:text-cocoa"
                >
                    <X size={24} />
                </button>

                <h2 className="text-2xl font-serif font-bold text-cocoa mb-1 text-center">Settlement</h2>
                <p className="text-center text-xs text-gray-400 mb-6">Trip financial breakdown</p>

                {/* Individual Stats */}
                <div className="space-y-4 mb-8">
                    {users.map(u => {
                        const paid = calculations.totalPaid[u.name] || 0;
                        const share = calculations.totalShare[u.name] || 0;
                        const balance = calculations.balances[u.name] || 0;
                        const isPositive = balance >= 0;

                        return (
                            <div key={u.id} className="bg-cream rounded-xl p-3 border border-sand/50">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="font-bold text-cocoa">{u.name}</span>
                                    <span className={`text-sm font-bold ${isPositive ? 'text-green-600' : 'text-accent'}`}>
                                        {isPositive ? '+' : ''} ₩ {balance.toLocaleString()}
                                    </span>
                                </div>
                                <div className="flex text-[10px] text-gray-500 justify-between bg-white p-2 rounded-lg">
                                    <span>Paid: ₩ {paid.toLocaleString()}</span>
                                    <span>Share: ₩ {Math.round(share).toLocaleString()}</span>
                                </div>
                            </div>
                        );
                    })}
                </div>

                <div className="h-px bg-sand w-full my-4"></div>

                {/* Final Plan */}
                <h3 className="text-sm font-bold text-cocoa mb-3 uppercase tracking-wide">Transfers Required</h3>
                {calculations.debts.length === 0 ? (
                    <div className="flex flex-col items-center py-6 text-green-600">
                        <Check size={32} className="mb-2"/>
                        <p className="font-bold">All settled up!</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {calculations.debts.map((d, i) => (
                            <div key={i} className="flex items-center justify-between p-3 bg-cocoa text-white rounded-xl shadow-md">
                                <div className="flex items-center gap-2">
                                    <span className="font-bold">{d.from}</span>
                                    <ArrowRight size={14} className="text-sand" />
                                    <span className="font-bold">{d.to}</span>
                                </div>
                                <span className="font-bold text-accent">₩ {d.amount.toLocaleString()}</span>
                            </div>
                        ))}
                        <p className="text-[10px] text-gray-400 text-center mt-2">
                            *Calculations minimize the number of transactions.
                        </p>
                    </div>
                )}
            </div>
        </div>
      )}

      {/* Edit User Modal */}
      {selectedUser && (
          <div className="fixed inset-0 bg-cocoa/30 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
             <div className="bg-white rounded-[2rem] w-full max-w-xs p-6 shadow-2xl animate-[float_0.3s_ease-out]">
                 <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-bold text-cocoa flex items-center"><UserCog size={18} className="mr-2"/> Edit Member</h2>
                    <button onClick={() => setSelectedUser(null)}><X size={18} className="text-gray-400"/></button>
                 </div>
                 
                 <label className="text-xs font-bold text-latte uppercase">Display Name</label>
                 <input 
                    type="text" 
                    value={editingName}
                    onChange={(e) => setEditingName(e.target.value)}
                    className="w-full p-3 bg-cream rounded-xl mt-2 text-cocoa font-bold text-center focus:outline-none focus:ring-1 focus:ring-cocoa"
                 />

                 <div className="flex flex-col gap-2 mt-6">
                    <button 
                        onClick={handleUpdateUser}
                        className="w-full py-3 bg-cocoa text-white rounded-xl font-bold shadow-md hover:bg-latte flex items-center justify-center"
                    >
                        <Check size={16} className="mr-2" /> Save Changes
                    </button>
                    <button 
                        onClick={handleDeleteUser}
                        className="w-full py-3 bg-white border border-red-100 text-red-400 rounded-xl font-bold hover:bg-red-50 flex items-center justify-center"
                    >
                        <Trash2 size={16} className="mr-2" /> Remove from Trip
                    </button>
                 </div>
             </div>
          </div>
      )}

    </div>
  );
};

export default ExpenseView;