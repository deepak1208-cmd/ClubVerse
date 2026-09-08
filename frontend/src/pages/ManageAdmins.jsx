import React, { useEffect, useState } from "react";
import { UserCog, Search } from "lucide-react";
import { api } from "../api";
import { useToast } from "../ToastContext";

export default function ManageAdmins() {
  const toast = useToast();
  const [clubs, setClubs] = useState([]);
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [selectedClub, setSelectedClub] = useState({}); // { [userId]: clubId }
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
      loadClubs(); // refresh admin counts
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
    <div style={{ maxWidth: 700, margin: "0 auto", padding: "24px 20px" }}>
      <p className="serif" style={{ fontSize: 24, marginBottom: 4, display: "flex", alignItems: "center", gap: 10 }}>
        <UserCog size={22} /> Manage club admins
      </p>
      <p style={{ fontSize: 13, opacity: 0.6, marginBottom: 20 }}>
        Give a student posting rights for their club (max 2 per club), or hand it back to a plain student account.
      </p>

      <div className="card" style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 14px", marginBottom: 20 }}>
        <Search size={16} opacity={0.5} />
        <input className="input" style={{ border: "none", padding: 0 }} placeholder="Search by name or email..." value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      {error && <p style={{ color: "#E85D4E" }}>{error}</p>}
      {loading && <p style={{ opacity: 0.5, fontSize: 14 }}>Loading...</p>}

      {!loading && users.length === 0 && <p style={{ opacity: 0.5, fontSize: 14 }}>No students found.</p>}

      <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 28 }}>
        {users.map((u) => {
          const chosenClub = clubs.find((c) => String(c.id) === String(selectedClub[u.id]));
          const chosenClubFull = chosenClub && chosenClub.admin_count >= 2;
          return (
            <div key={u.id} className="card fade-in" style={{ padding: 14, display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
              <div style={{ flex: 1, minWidth: 160 }}>
                <p style={{ fontSize: 14, fontWeight: 600 }}>{u.name}</p>
                <p style={{ fontSize: 12, opacity: 0.6 }}>{u.email}</p>
              </div>

              {u.role === "club_admin" ? (
                <>
                  <span className="pill" style={{ background: "rgba(27,127,121,0.12)", color: "#1B7F79" }}>
                    Admin — {u.club_name}
                  </span>
                  <button className="btn-secondary" onClick={() => handleDemote(u)} disabled={busyUserId === u.id}>
                    {busyUserId === u.id ? "..." : "Remove"}
                  </button>
                </>
              ) : (
                <>
                  <select
                    className="input"
                    style={{ width: 190 }}
                    value={selectedClub[u.id] || ""}
                    onChange={(e) => setSelectedClub((s) => ({ ...s, [u.id]: e.target.value }))}
                  >
                    <option value="">Pick a club...</option>
                    {clubs.map((c) => (
                      <option key={c.id} value={c.id} disabled={c.admin_count >= 2}>
                        {c.name} ({c.admin_count}/2 admins{c.admin_count >= 2 ? " — full" : ""})
                      </option>
                    ))}
                  </select>
                  <button className="btn-teal" onClick={() => handlePromote(u)} disabled={busyUserId === u.id || chosenClubFull}>
                    {busyUserId === u.id ? "..." : "Make admin"}
                  </button>
                </>
              )}
            </div>
          );
        })}
      </div>

      <p style={{ fontSize: 13, fontWeight: 600, opacity: 0.6, marginBottom: 10 }}>Admins per club</p>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        {clubs.map((c) => (
          <span key={c.id} className="pill" style={{ background: c.admin_count >= 2 ? "rgba(27,127,121,0.12)" : "rgba(27,31,59,0.05)", color: c.admin_count >= 2 ? "#1B7F79" : "inherit" }}>
            {c.name}: {c.admin_count}/2
          </span>
        ))}
      </div>
    </div>
  );
}
