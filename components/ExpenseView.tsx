import React, { useState, useMemo } from 'react';
import { Expense, User } from '../types';
import { Plus, DollarSign, Wallet, ArrowRight, Trash2, RefreshCw } from 'lucide-react';
import { addExpenseItem, addUser, deleteExpenseItem } from '../services/firebaseService';

interface Props {
  expenses: Expense[];
  users: User[];
}

const ExpenseView: React.FC<Props> = ({ expenses, users }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newExpense, setNewExpense] = useState<Partial<Expense>>({ amount: 0, payer: users[0]?.name });
  const [newUser, setNewUser] = useState('');
  
  // Currency Converter State
  const [converterAmount, setConverterAmount] = useState<string>('');
  const [exchangeRate, setExchangeRate] = useState(0.024); // Rough KRW to TWD
  
  const convertedValue = converterAmount ? (parseFloat(converterAmount) * exchangeRate).toFixed(0) : '0';

  // Calculations
  const debts = useMemo(() => {
    if (users.length === 0) return [];
    
    const balances: Record<string, number> = {};
    users.forEach(u => balances[u.name] = 0);

    expenses.forEach(exp => {
      const paidBy = exp.payer;
      const amount = exp.amount;
      const share = amount / exp.involved.length;

      balances[paidBy] += amount; // Payer gets credit
      exp.involved.forEach(person => {
        // Only deduct if person exists in current user list (handle deleted users edge case)
        if (balances[person] !== undefined) {
             balances[person] -= share;
        }
      });
    });

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

    return result;
  }, [expenses, users]);

  const totalSpent = expenses.reduce((acc, curr) => acc + curr.amount, 0);

  const handleAddUser = async () => {
    if (newUser && !users.find(u => u.name === newUser)) {
      await addUser(newUser);
      setNewUser('');
    }
  };

  const handleAddExpense = async () => {
    if (newExpense.amount && newExpense.description && newExpense.payer) {
      await addExpenseItem({
        amount: Number(newExpense.amount),
        description: newExpense.description!,
        payer: newExpense.payer!,
        date: new Date().toISOString(),
        involved: users.map(u => u.name)
      });
      setIsModalOpen(false);
      setNewExpense({ amount: 0, payer: users[0]?.name });
    }
  };

  const handleDeleteExpense = async (id: string) => {
    await deleteExpenseItem(id);
  };

  return (
    <div className="pb-24 p-5 space-y-6">
      
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
        <p className="text-sand text-sm font-medium mb-1 opacity-80">Total Trip Spending</p>
        <h2 className="text-4xl font-serif font-bold tracking-tight">₩ {totalSpent.toLocaleString()}</h2>
        <div className="mt-6 flex items-center justify-between">
            <div className="flex -space-x-2">
            {users.map((u, i) => (
                <div key={i} className="w-8 h-8 rounded-full bg-latte border-2 border-cocoa flex items-center justify-center text-xs font-bold uppercase text-white shadow-md">
                {u.name.charAt(0)}
                </div>
            ))}
            </div>
            {users.length < 6 && (
                <div className="flex bg-white/10 rounded-full p-1 pl-3 items-center backdrop-blur-sm">
                    <input 
                        className="bg-transparent text-white text-xs w-20 focus:outline-none placeholder-white/50"
                        placeholder="New name..."
                        value={newUser}
                        onChange={e => setNewUser(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleAddUser()}
                    />
                    <button onClick={handleAddUser} className="bg-white text-cocoa rounded-full p-1"><Plus size={12} /></button>
                </div>
            )}
        </div>
      </div>

      {/* Settlement Plan */}
      {debts.length > 0 && (
        <div className="bg-white rounded-3xl p-5 shadow-[0_4px_20px_rgba(0,0,0,0.03)]">
           <h3 className="text-cocoa font-bold mb-4 flex items-center text-sm uppercase tracking-wide">
             <Wallet className="mr-2 text-latte" size={16}/> Who owes who
           </h3>
           <div className="space-y-3">
             {debts.map((d, i) => (
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
        <h3 className="text-cocoa font-bold ml-1 text-sm uppercase tracking-wide">Recent</h3>
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
                            <p className="text-[10px] text-latte uppercase font-bold tracking-wider">{expense.payer} Paid</p>
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

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-cocoa/30 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-[2rem] w-full max-w-sm p-6 shadow-2xl animate-[float_0.3s_ease-out]">
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
               <div>
                 <label className="text-xs font-bold text-latte uppercase">Who Paid?</label>
                 <div className="flex flex-wrap gap-2 mt-2">
                    {users.map(u => (
                        <button 
                            key={u.name}
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
            </div>
            <div className="flex gap-3 mt-8">
              <button onClick={() => setIsModalOpen(false)} className="flex-1 py-3 text-latte font-bold hover:bg-cream rounded-xl transition-colors">Cancel</button>
              <button onClick={handleAddExpense} className="flex-1 py-3 bg-accent text-white rounded-xl font-bold shadow-lg hover:bg-orange-600 transition-colors">Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExpenseView;