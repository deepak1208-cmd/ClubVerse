import React, { useEffect, useState } from "react";
import { LayoutGrid, Calendar, Star, BarChart3, AlertTriangle, Search, ChevronRight } from "lucide-react";
import { api } from "../api";

export default function DeanDashboard() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [inactiveSearch, setInactiveSearch] = useState("");

  useEffect(() => {
    api.getDashboard().then(setData).catch((e) => setError(e.message));
  }, []);

  if (error) return <div className="page-container"><p className="text-error">{error}</p></div>;
  
  const loading = !data;

  // Filter inactive clubs based on search
  const filteredInactiveClubs = data?.inactive_clubs.filter(c => 
    c.name.toLowerCase().includes(inactiveSearch.toLowerCase())
  ) || [];

  return (
    <div className="page-container" style={{ maxWidth: '1400px' }}>
      {/* Page Header */}
      <div style={{ marginBottom: 32 }}>
        <h1 className="section-title" style={{ fontSize: 28, fontWeight: 700, color: '#101828', marginBottom: 8 }}>
          Campus Overview
        </h1>
        <p style={{ fontSize: 14, color: '#64748B', maxWidth: 600 }}>
          Monitor club activity, event participation, and campus engagement across all committees.
        </p>
      </div>

      {/* Metric Strip */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
        gap: 16, 
        marginBottom: 32 
      }}>
        {[
          { label: "Active Clubs", value: data?.total_clubs ?? '—', icon: LayoutGrid, color: '#3155D9' },
          { label: "Committees", value: data?.total_committees ?? '—', icon: BarChart3, color: '#0891b2' },
          { label: "Events Posted", value: data?.total_events ?? '—', icon: Calendar, color: '#7c3aed' },
          { label: "Avg. Rating", value: data?.avg_rating ?? '—', icon: Star, color: '#f59e0b' },
        ].map((metric) => (
          <div key={metric.label} className="card" style={{ 
            padding: 20, 
            display: 'flex', 
            flexDirection: 'column',
            gap: 12
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ 
                width: 40, 
                height: 40, 
                borderRadius: 10, 
                background: `${metric.color}15`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <metric.icon size={20} color={metric.color} />
              </div>
            </div>
            <div>
              <p style={{ fontSize: 28, fontWeight: 700, color: '#101828', lineHeight: 1.2 }}>
                {loading ? <span className="skeleton" style={{ display: 'inline-block', width: 60, height: 32 }} /> : metric.value}
              </p>
              <p style={{ fontSize: 13, color: '#64748B', marginTop: 4 }}>{metric.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Main Workspace - Two Column Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 24 }}>
        {/* Left Column - Committee Activity */}
        <div className="card" style={{ padding: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ 
                width: 36, 
                height: 36, 
                borderRadius: 8, 
                background: '#3155D915',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <BarChart3 size={18} color="#3155D9" />
              </div>
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 600, color: '#101828' }}>Events by Committee</h3>
                <p style={{ fontSize: 13, color: '#64748B' }}>Activity breakdown across all committees</p>
              </div>
            </div>
          </div>

          {loading ? (
            <div style={{ height: 280 }}><div className="skeleton" style={{ width: '100%', height: '100%' }} /></div>
          ) : data?.events_by_committee.length === 0 ? (
            <div style={{ 
              padding: 48, 
              textAlign: 'center', 
              background: '#F8FAFC', 
              borderRadius: 12,
              border: '1px dashed #E2E8F0'
            }}>
              <BarChart3 size={40} color="#CBD5E1" style={{ marginBottom: 16 }} />
              <p style={{ fontSize: 15, fontWeight: 600, color: '#101828', marginBottom: 4 }}>No committee activity yet</p>
              <p style={{ fontSize: 14, color: '#64748B' }}>Events posted by committees will appear here</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {data?.events_by_committee.map((committee) => {
                const maxValue = Math.max(...data.events_by_committee.map(c => c.event_count));
                const percentage = maxValue > 0 ? (committee.event_count / maxValue) * 100 : 0;
                
                return (
                  <div key={committee.name} style={{ marginBottom: 4 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                      <span style={{ fontSize: 14, fontWeight: 500, color: '#101828' }}>{committee.name}</span>
                      <span style={{ fontSize: 14, fontWeight: 600, color: '#101828' }}>{committee.event_count}</span>
                    </div>
                    <div style={{ 
                      height: 8, 
                      background: '#F1F5F9', 
                      borderRadius: 4, 
                      overflow: 'hidden' 
                    }}>
                      <div style={{ 
                        width: `${percentage}%`, 
                        height: '100%', 
                        background: committee.color,
                        borderRadius: 4,
                        transition: 'width 0.3s ease'
                      }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column - Inactive Clubs */}
        <div className="card" style={{ padding: 24, height: 'fit-content' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
            <div style={{ 
              width: 36, 
              height: 36, 
              borderRadius: 8, 
              background: '#EF444415',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <AlertTriangle size={18} color="#EF4444" />
            </div>
            <div>
              <h3 style={{ fontSize: 16, fontWeight: 600, color: '#101828' }}>Clubs Without Events</h3>
              <p style={{ fontSize: 13, color: '#64748B' }}>
                {data?.inactive_clubs.length ?? 0} clubs need attention
              </p>
            </div>
          </div>

          {loading ? (
            <div style={{ spaceY: 8 }}>
              {[1, 2, 3].map(i => (
                <div key={i} className="skeleton" style={{ height: 48, marginBottom: 8 }} />
              ))}
            </div>
          ) : data?.inactive_clubs.length === 0 ? (
            <div style={{ 
              padding: 32, 
              textAlign: 'center', 
              background: '#F8FAFC', 
              borderRadius: 12 
            }}>
              <p style={{ fontSize: 14, fontWeight: 600, color: '#059669', marginBottom: 4 }}>All clubs are active!</p>
              <p style={{ fontSize: 13, color: '#64748B' }}>Every club has posted at least one event</p>
            </div>
          ) : (
            <>
              {/* Search Input */}
              <div style={{ position: 'relative', marginBottom: 16 }}>
                <Search size={16} color="#64748B" style={{ position: 'absolute', left: 12, top: 10 }} />
                <input
                  type="text"
                  placeholder="Search clubs..."
                  value={inactiveSearch}
                  onChange={(e) => setInactiveSearch(e.target.value)}
                  className="input"
                  style={{ paddingLeft: 36, fontSize: 14 }}
                />
              </div>

              {/* Club List Table */}
              <div style={{ 
                maxHeight: 520, 
                overflowY: 'auto',
                border: '1px solid #E2E8F0',
                borderRadius: 10
              }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead style={{ position: 'sticky', top: 0, background: '#F8FAFC' }}>
                    <tr>
                      <th style={{ 
                        padding: '10px 12px', 
                        textAlign: 'left', 
                        fontSize: 12, 
                        fontWeight: 600, 
                        color: '#64748B',
                        borderBottom: '1px solid #E2E8F0',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em'
                      }}>Club</th>
                      <th style={{ 
                        padding: '10px 12px', 
                        textAlign: 'left', 
                        fontSize: 12, 
                        fontWeight: 600, 
                        color: '#64748B',
                        borderBottom: '1px solid #E2E8F0',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em'
                      }}>Committee</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredInactiveClubs.length === 0 ? (
                      <tr>
                        <td colSpan={2} style={{ padding: 32, textAlign: 'center', color: '#64748B', fontSize: 14 }}>
                          {inactiveSearch ? `No clubs matching "${inactiveSearch}"` : 'No clubs found'}
                        </td>
                      </tr>
                    ) : (
                      filteredInactiveClubs.map((club, index) => (
                        <tr key={club.name} style={{ 
                          borderTop: index === 0 ? '1px solid #E2E8F0' : 'none',
                          borderBottom: '1px solid #F1F5F9'
                        }}>
                          <td style={{ 
                            padding: '12px', 
                            fontSize: 14, 
                            color: '#101828',
                            fontWeight: 500
                          }}>
                            {club.name}
                          </td>
                          <td style={{ 
                            padding: '12px', 
                            fontSize: 13, 
                            color: '#64748B'
                          }}>
                            {club.committee_name}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {filteredInactiveClubs.length > 0 && (
                <p style={{ fontSize: 12, color: '#64748B', marginTop: 12, textAlign: 'right' }}>
                  Showing {filteredInactiveClubs.length} of {data.inactive_clubs.length} clubs
                </p>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
