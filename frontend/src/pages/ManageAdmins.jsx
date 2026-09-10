import React, { useEffect, useState } from "react";
import { UserCog, Search, Shield, Building2 } from "lucide-react";
import { api } from "../api";
import { useToast } from "../ToastContext";

export default function ManageAdmins() {
  const toast = useToast();
  const [clubs, setClubs] = useState([]);
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [selectedClub, setSelectedClub] = useState({});
  const [busyUserId, setBusyUserId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  function loadClubs() {
    api.getClubs().then(setClubs).catch((e) => setError(e.message));
  }
  useEffect(loadClubs, []);

  function loadUsers(q) {
    setLoading(true);
    api.searchUsers(q).then(setUsers).catch((e) => setError(e.message)).finally(() => setLoading(false));
  }

  useEffect(() => {
    const t = setTimeout(() => loadUsers(search), 250);
    return () => clearTimeout(t);
  }, [search]);

  async function handlePromote(user) {
    const clubId = selectedClub[user.id];
    if (!clubId) {
      toast.error("Pick a club first");
      return;
    }
    setBusyUserId(user.id);
    try {
      await api.promoteToClubAdmin(clubId, user.id);
      toast.success(`${user.name} can now post for that club`);
      loadUsers(search);
      loadClubs();
    } catch (e) {
      toast.error(e.message);
    } finally {
      setBusyUserId(null);
    }
  }

  async function handleDemote(user) {
    setBusyUserId(user.id);
    try {
      await api.demoteUser(user.id);
      toast.success(`${user.name} is now a regular student`);
      loadUsers(search);
      loadClubs();
    } catch (e) {
      toast.error(e.message);
    } finally {
      setBusyUserId(null);
    }
  }

  return (
    <div className="page-container" style={{ maxWidth: '1200px' }}>
      {/* Page Header */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
          <div style={{ 
            width: 40, 
            height: 40, 
            borderRadius: 10, 
            background: '#3155D915',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <UserCog size={20} color="#3155D9" />
          </div>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 700, color: '#101828' }}>Club Administration</h1>
            <p style={{ fontSize: 14, color: '#64748B' }}>
              Assign posting rights to students (maximum 2 admins per club)
            </p>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="card" style={{ 
        padding: 16, 
        marginBottom: 24,
        display: 'flex', 
        alignItems: 'center', 
        gap: 12 
      }}>
        <Search size={18} color="#64748B" />
        <input 
          className="input" 
          style={{ border: "none", padding: 0, fontSize: 14 }} 
          placeholder="Search by name or email..." 
          value={search} 
          onChange={(e) => setSearch(e.target.value)} 
        />
      </div>

      {error && (
        <div style={{ 
          padding: 16, 
          marginBottom: 20, 
          background: '#FEF2F2', 
          border: '1px solid #FECACA',
          borderRadius: 10,
          color: '#DC2626',
          fontSize: 14
        }}>
          {error}
        </div>
      )}

      {/* Users Table */}
      <div className="card" style={{ marginBottom: 32, overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #E2E8F0', background: '#F8FAFC' }}>
          <h2 style={{ fontSize: 16, fontWeight: 600, color: '#101828' }}>All Users</h2>
          <p style={{ fontSize: 13, color: '#64748B', marginTop: 2 }}>Manage admin access and club assignments</p>
        </div>

        {loading && (
          <div style={{ padding: 40, textAlign: 'center' }}>
            <div className="spinner" style={{ margin: '0 auto' }}></div>
            <p style={{ fontSize: 14, color: '#64748B', marginTop: 12 }}>Loading users...</p>
          </div>
        )}

        {!loading && users.length === 0 && (
          <div style={{ padding: 48, textAlign: 'center' }}>
            <Search size={40} color="#CBD5E1" style={{ marginBottom: 16 }} />
            <p style={{ fontSize: 15, fontWeight: 600, color: '#101828', marginBottom: 4 }}>No users found</p>
            <p style={{ fontSize: 14, color: '#64748B' }}>Try adjusting your search terms</p>
          </div>
        )}

        {!loading && users.length > 0 && (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#F8FAFC' }}>
                  <th style={{ 
                    padding: '14px 20px', 
                    textAlign: 'left', 
                    fontSize: 12, 
                    fontWeight: 600, 
                    color: '#64748B',
                    borderBottom: '1px solid #E2E8F0',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em'
                  }}>Person</th>
                  <th style={{ 
                    padding: '14px 20px', 
                    textAlign: 'left', 
                    fontSize: 12, 
                    fontWeight: 600, 
                    color: '#64748B',
                    borderBottom: '1px solid #E2E8F0',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em'
                  }}>Assigned Club</th>
                  <th style={{ 
                    padding: '14px 20px', 
                    textAlign: 'left', 
                    fontSize: 12, 
                    fontWeight: 600, 
                    color: '#64748B',
                    borderBottom: '1px solid #E2E8F0',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em'
                  }}>Role</th>
                  <th style={{ 
                    padding: '14px 20px', 
                    textAlign: 'right', 
                    fontSize: 12, 
                    fontWeight: 600, 
                    color: '#64748B',
                    borderBottom: '1px solid #E2E8F0',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em'
                  }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u, index) => {
                  const chosenClub = clubs.find((c) => String(c.id) === String(selectedClub[u.id]));
                  const chosenClubFull = chosenClub && chosenClub.admin_count >= 2;
                  
                  return (
                    <tr key={u.id} style={{ 
                      borderTop: index === 0 ? '1px solid #E2E8F0' : 'none',
                      borderBottom: '1px solid #F1F5F9'
                    }}>
                      <td style={{ padding: '16px 20px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                          <span style={{ fontSize: 14, fontWeight: 600, color: '#101828' }}>{u.name}</span>
                          <span style={{ fontSize: 13, color: '#64748B', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.email}</span>
                        </div>
                      </td>
                      <td style={{ padding: '16px 20px' }}>
                        {u.role === "club_admin" ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <Building2 size={14} color="#64748B" />
                            <span style={{ fontSize: 14, color: '#101828' }}>{u.club_name}</span>
                          </div>
                        ) : (
                          <select
                            className="input"
                            style={{ width: 200, fontSize: 14, padding: '8px 12px' }}
                            value={selectedClub[u.id] || ""}
                            onChange={(e) => setSelectedClub((s) => ({ ...s, [u.id]: e.target.value }))}
                          >
                            <option value="">Select club...</option>
                            {clubs.map((c) => (
                              <option key={c.id} value={c.id} disabled={c.admin_count >= 2}>
                                {c.name} ({c.admin_count}/2)
                              </option>
                            ))}
                          </select>
                        )}
                      </td>
                      <td style={{ padding: '16px 20px' }}>
                        {u.role === "club_admin" ? (
                          <span style={{ 
                            display: 'inline-flex', 
                            alignItems: 'center', 
                            gap: 6,
                            padding: '6px 12px',
                            background: '#DCFCE7',
                            color: '#059669',
                            borderRadius: 99,
                            fontSize: 13,
                            fontWeight: 500
                          }}>
                            <Shield size={14} />
                            Admin
                          </span>
                        ) : (
                          <span style={{ 
                            display: 'inline-flex', 
                            alignItems: 'center', 
                            gap: 6,
                            padding: '6px 12px',
                            background: '#F1F5F9',
                            color: '#64748B',
                            borderRadius: 99,
                            fontSize: 13,
                            fontWeight: 500
                          }}>
                            Student
                          </span>
                        )}
                      </td>
                      <td style={{ padding: '16px 20px', textAlign: 'right' }}>
                        {u.role === "club_admin" ? (
                          <button 
                            className="btn-secondary" 
                            onClick={() => handleDemote(u)} 
                            disabled={busyUserId === u.id}
                            style={{ 
                              fontSize: 13, 
                              padding: '8px 16px',
                              color: '#DC2626',
                              borderColor: '#FECACA'
                            }}
                          >
                            {busyUserId === u.id ? "Removing..." : "Remove Admin"}
                          </button>
                        ) : (
                          <button 
                            className="btn-primary" 
                            onClick={() => handlePromote(u)} 
                            disabled={busyUserId === u.id || chosenClubFull}
                            style={{ 
                              fontSize: 13, 
                              padding: '8px 16px',
                              background: chosenClubFull ? '#CBD5E1' : '#3155D9'
                            }}
                          >
                            {busyUserId === u.id ? "..." : chosenClubFull ? "Club Full" : "Make Admin"}
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Club Admin Coverage Grid */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
          <div style={{ 
            width: 36, 
            height: 36, 
            borderRadius: 8, 
            background: '#0891b215',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Building2 size={18} color="#0891b2" />
          </div>
          <div>
            <h2 style={{ fontSize: 16, fontWeight: 600, color: '#101828' }}>Admin Coverage by Club</h2>
            <p style={{ fontSize: 13, color: '#64748B' }}>Track admin slot utilization across all clubs</p>
          </div>
        </div>

        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', 
          gap: 16 
        }}>
          {clubs.map((club) => {
            const slotsFilled = club.admin_count;
            const isEmpty = slotsFilled === 0;
            const isFull = slotsFilled >= 2;
            
            return (
              <div key={club.id} className="card" style={{ padding: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                  <div style={{ 
                    width: 40, 
                    height: 40, 
                    borderRadius: 10, 
                    background: `${club.committee_color || '#64748B'}15`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 18,
                    fontWeight: 700,
                    color: club.committee_color || '#64748B'
                  }}>
                    {club.name.charAt(0).toUpperCase()}
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: 14, fontWeight: 600, color: '#101828', marginBottom: 2 }}>{club.name}</p>
                    <p style={{ fontSize: 12, color: '#64748B' }}>{club.committee_name}</p>
                  </div>
                </div>
                
                <div style={{ marginBottom: 8 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span style={{ fontSize: 13, color: '#64748B' }}>Admin slots</span>
                    <span style={{ fontSize: 13, fontWeight: 600, color: '#101828' }}>
                      {slotsFilled} of 2 filled
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    {[0, 1].map((slot) => (
                      <div key={slot} style={{ 
                        flex: 1, 
                        height: 8, 
                        borderRadius: 4, 
                        background: slot < slotsFilled 
                          ? (isEmpty ? '#CBD5E1' : isFull ? '#059669' : '#3155D9')
                          : '#F1F5F9'
                      }} />
                    ))}
                  </div>
                </div>
                
                <p style={{ 
                  fontSize: 13, 
                  color: isEmpty ? '#DC2626' : isFull ? '#059669' : '#f59e0b',
                  fontWeight: 500
                }}>
                  {isEmpty ? '⚠ No admins assigned' : isFull ? '✓ All slots filled' : '⏳ 1 slot available'}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
