import { useState, useEffect, useRef, useMemo } from 'react';
import { useUser } from '../../context/UserContext';
import { useCatalogService } from '../../hooks/useCatalogService';
import { useIdentityService } from '../../hooks/useIdentityService';
import { useThreadsService } from '../../hooks/useThreadsService';
import { useProducts } from '../../context/ProductsContext';
import { getMediaUrls } from '../../api/documentService';
import { getVariantDisplayCodes, formatCodes } from '../../utils/variantComponentCodes';
import ThreadHistorySelect from '../../components/ThreadHistorySelect';
import './Hilos.css';

const THREAD_TYPE_DESIGN = 'COMMERCIAL_DESIGN';
const THREAD_TYPE_DEVELOPMENT = 'COMMERCIAL_DEVELOPMENT';
const THREAD_TYPE_QUOTE = 'COMMERCIAL_QUOTE';

const EMPTY_VARIANTS = [];
function enrichVariantsWithProducts(variants, products) {
  if (!variants?.length || !products?.length) return variants || [];
  return variants.map((v) => {
    if (!v.productVariantId && v.sapRef) return v;
    const pid = v.productVariantId || v.id;
    for (const p of products) {
      const pv = p.variants?.find((pv) => String(pv.id) === String(pid));
      if (pv) {
        return {
          ...v,
          sapRef: v.sapRef ?? pv.sapRef,
          sapCode: v.sapCode ?? pv.sapCode,
          baseCode: v.baseCode ?? p.code,
          baseName: v.baseName ?? p.name,
          baseImage: v.baseImage ?? pv.image,
        };
      }
    }
    return v;
  });
}

export default function Hilos() {
  const { user, role } = useUser();
  const { products } = useProducts();
  const catalog = useCatalogService();
  const identity = useIdentityService();
  const threadsApi = useThreadsService();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  // master-detail: selected project
  const [selectedId, setSelectedId] = useState(null);
  const [threads, setThreads] = useState({});
  const [loadingThreads, setLoadingThreads] = useState({});
  const [opening, setOpening] = useState(null);
  const [closing, setClosing] = useState(null);
  const [chatOpen, setChatOpen] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [userNames, setUserNames] = useState({});
  const [imageUrls, setImageUrls] = useState({});
  const messagesEndRef = useRef(null);
  const threadsApiRef = useRef(threadsApi);
  threadsApiRef.current = threadsApi;

  const isComercial = role === 'comercial';
  const isCotizador = role === 'cotizador';
  const isDisenador = role === 'disenador';
  const isDesarrollo = role === 'desarrollo';

  useEffect(() => { loadProjects(); }, [user?.id, role]);

  const loadProjects = () => {
    if (!user?.id) return;
    setLoading(true);
    let loader;
    if (isComercial) loader = catalog.getProjectsBySales(user.id);
    else if (isCotizador) loader = catalog.getProjectsByAssignedQuoter(user.id);
    else if (isDisenador) loader = catalog.getProjectsByAssignedDesigner(user.id);
    else if (isDesarrollo) loader = catalog.getProjectsByAssignedDevelopment(user.id);
    else loader = Promise.resolve([]);
    loader
      .then((data) => setProjects(data || []))
      .catch(() => setProjects([]))
      .finally(() => setLoading(false));
  };

  const loadThreads = (projectId) => {
    setLoadingThreads((p) => ({ ...p, [projectId]: true }));
    threadsApi
      .getThreadsByProject(projectId)
      .then((data) => setThreads((t) => ({ ...t, [projectId]: data || [] })))
      .catch(() => setThreads((t) => ({ ...t, [projectId]: [] })))
      .finally(() => setLoadingThreads((p) => ({ ...p, [projectId]: false })));
  };

  const handleSelect = (projectId) => {
    setSelectedId(projectId);
    if (!threads[projectId]) loadThreads(projectId);
  };

  const getThreadTypeForRole = () => {
    if (isCotizador) return THREAD_TYPE_QUOTE;
    if (isDisenador) return THREAD_TYPE_DESIGN;
    if (isDesarrollo) return THREAD_TYPE_DEVELOPMENT;
    return null;
  };

  const canOpenThreadForVariant = (v) => {
    if (isCotizador) return !v.quotedAt;
    if (isDisenador) return !v.designedAt;
    if (isDesarrollo) return !v.developedAt;
    return false;
  };

  const handleOpenThread = async (projectId, variantId) => {
    if (!user?.id) return;
    const type = getThreadTypeForRole();
    if (!type && !isComercial) return;
    const key = `${projectId}-${variantId}`;
    setOpening(key);
    try {
      await threadsApi.openThread(projectId, variantId, type || THREAD_TYPE_DESIGN, user.id);
      loadThreads(projectId);
    } catch (err) {
      alert(err?.message || 'Error al abrir hilo');
    } finally {
      setOpening(null);
    }
  };

  const handleCloseThread = async (projectId, threadId) => {
    if (!user?.id) return;
    setClosing(threadId);
    try {
      await threadsApi.closeThread(threadId, user.id);
      loadThreads(projectId);
      if (chatOpen?.threadId === threadId) setChatOpen(null);
    } catch (err) {
      alert(err?.message || 'Error al cerrar hilo');
    } finally {
      setClosing(null);
    }
  };

  const openChat = (thread, projectId, productLabel) => {
    setChatOpen({ threadId: thread.id, projectId, productLabel, closedAt: thread.closedAt });
    setMessages([]);
    setNewMessage('');
  };

  useEffect(() => {
    if (!chatOpen?.threadId) return;
    const threadId = chatOpen.threadId;
    const fetchMessages = (isInitial = false) => {
      if (isInitial) setLoadingMessages(true);
      threadsApiRef.current
        .getThreadMessages(threadId)
        .then((data) => setMessages(data || []))
        .catch(() => {})
        .finally(() => { if (isInitial) setLoadingMessages(false); });
    };
    fetchMessages(true);
    const interval = setInterval(() => fetchMessages(false), 4000);
    return () => clearInterval(interval);
  }, [chatOpen?.threadId]);

  useEffect(() => {
    const ids = [...new Set(messages.map((m) => m.userId).filter(Boolean))];
    const missing = ids.filter((id) => !userNames[id] && id !== user?.id);
    if (missing.length === 0) return;
    identity.getUsersByIds(missing).then((users) => {
      setUserNames((prev) => {
        const next = { ...prev };
        users.forEach((u) => { next[u.id] = u.name; });
        return next;
      });
    });
  }, [messages, identity, user?.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async () => {
    const content = newMessage?.trim();
    if (!content || !user?.id || !chatOpen?.threadId) return;
    if (chatOpen.closedAt) { alert('No se pueden enviar mensajes a un hilo cerrado'); return; }
    setSending(true);
    try {
      await threadsApi.addThreadMessage(chatOpen.threadId, user.id, content);
      setNewMessage('');
      const updated = await threadsApi.getThreadMessages(chatOpen.threadId);
      setMessages(updated || []);
    } catch (err) {
      alert(err?.message || 'Error al enviar mensaje');
    } finally {
      setSending(false);
    }
  };

  const formatMessageTime = (iso) => {
    if (!iso) return '';
    try {
      return new Date(iso).toLocaleString('es-CO', { dateStyle: 'short', timeStyle: 'short' });
    } catch { return iso; }
  };

  const filtered = projects.filter((p) =>
    (p.consecutive || p.name || '').toLowerCase().includes(searchText.trim().toLowerCase())
  );

  const displayProjects = useMemo(
    () => filtered.map((p) => ({
      ...p,
      variants: enrichVariantsWithProducts(p.variants || EMPTY_VARIANTS, products || []),
    })),
    [filtered, products]
  );

  const selectedProject = displayProjects.find((p) => p.id === selectedId) || null;
  const projectThreads = selectedId ? (threads[selectedId] || []) : [];
  const loadingT = selectedId ? loadingThreads[selectedId] : false;

  const allImageKeys = useMemo(() => {
    const keys = new Set();
    (selectedProject?.variants || []).forEach((v) => v.baseImage && keys.add(v.baseImage));
    return [...keys];
  }, [selectedProject]);

  useEffect(() => {
    if (allImageKeys.length === 0) { setImageUrls({}); return; }
    getMediaUrls(allImageKeys, 'image')
      .then((res) => setImageUrls(res.data || {}))
      .catch(() => setImageUrls({}));
  }, [allImageKeys.join(',')]);

  const getVariantCodes = (v) => {
    const currentComps = (v.components || []).reduce((o, c) => ({ ...o, [c.id]: c.value }), {});
    const originalComps = (v.components || []).reduce((o, c) => ({ ...o, [c.id]: c.catalogOriginalValue ?? c.originalValue ?? c.value }), {});
    return getVariantDisplayCodes({ sapRef: v.sapRef, sapCode: v.sapCode, type: v.type, currentByKey: currentComps, originalByKey: originalComps });
  };

  const getProductLabel = (v) => {
    const codes = getVariantCodes(v);
    const codeStr = codes ? formatCodes(codes.primary, codes.secondary) : '—';
    return `${codeStr} — ${v.baseName || 'Producto'}`;
  };

  if (loading) return <p className="hilos-loading">Cargando proyectos...</p>;

  return (
    <div className={`hilos-page${selectedId ? ' master-detail--detail-open' : ''}`}>
      {/* ── SIDEBAR ── */}
      <aside className="hilos-sidebar">
        <div className="hilos-sidebar-header">
          <h2>Hilos</h2>
          <input
            type="text"
            className="hilos-search"
            placeholder="Buscar proyecto..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
          />
        </div>

        {displayProjects.length === 0 ? (
          <p className="hilos-empty">{searchText.trim() ? 'Sin resultados' : 'No hay proyectos'}</p>
        ) : (
          <ul className="hilos-sidebar-list">
            {displayProjects.map((p) => {
              const open = (threads[p.id] || []).filter((t) => !t.closedAt).length;
              return (
                <li key={p.id}>
                  <button
                    type="button"
                    className={`hilos-sidebar-item${selectedId === p.id ? ' active' : ''}`}
                    onClick={() => handleSelect(p.id)}
                  >
                    <span className="hilos-sidebar-consec">{p.consecutive || p.name}</span>
                    <span className="hilos-sidebar-client">{(p.client || 'Sin cliente')} — {(p.name || 'Sin nombre')}</span>
                    {open > 0 && <span className="hilos-sidebar-dot">{open}</span>}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </aside>

      {/* ── DETAIL PANEL ── */}
      <main className="hilos-detail-panel">
        {!selectedProject ? (
          <div className="hilos-detail-empty">
            <span className="hilos-detail-empty-icon">💬</span>
            <p>Selecciona un proyecto para ver sus hilos</p>
          </div>
        ) : (
          <div className="hilos-detail-content">
            <div className="hilos-detail-header">
              <button
                type="button"
                className="hilos-back-btn"
                onClick={() => setSelectedId(null)}
              >
                ← Volver
              </button>
              <h2>{selectedProject.consecutive} — {selectedProject.name || selectedProject.client}</h2>
              <span className="hilos-detail-meta">{selectedProject.client}</span>
            </div>

            {loadingT ? (
              <p className="hilos-loading-threads">Cargando hilos...</p>
            ) : (
              <div className="hilos-products">
                {(selectedProject.variants || []).map((v) => {
                  const myType = getThreadTypeForRole();
                  const myThreads = myType
                    ? projectThreads.filter((t) => String(t.variantId) === String(v.id) && t.type === myType)
                    : [];
                  const hasOpenMyThread = myThreads.some((t) => !t.closedAt);
                  const variantThreads = projectThreads.filter((t) => String(t.variantId) === String(v.id));
                  const key = `${selectedId}-${v.id}`;
                  const codes = getVariantCodes(v);
                  const imgUrl = v.baseImage ? imageUrls[v.baseImage] : null;
                  const productLabel = getProductLabel(v);

                  return (
                    <div key={v.id} className="hilos-product-row">
                      <div className="hilos-product-info">
                        <div className="hilos-product-thumb">
                          {imgUrl
                            ? <img src={imgUrl} alt="" className="hilos-thumb-img" />
                            : <div className="hilos-thumb-placeholder">—</div>
                          }
                        </div>
                        <div className="hilos-product-meta">
                          {codes ? (
                            <div className="hilos-codigo-stack">
                              {codes.secondary && <span className="hilos-codigo-sap">{codes.secondary}</span>}
                              <span className={codes.secondary ? 'hilos-codigo-ref' : 'hilos-codigo-ref hilos-codigo-ref-only'}>{codes.primary}</span>
                            </div>
                          ) : <span className="hilos-codigo-empty">—</span>}
                          <span className="hilos-product-name">{v.baseName || 'Producto'}</span>
                        </div>
                      </div>

                      <div className="hilos-product-actions">
                        {(() => {
                          const myType = getThreadTypeForRole();
                          const activeThreads = projectThreads.filter(t => String(t.variantId) === String(v.id) && !t.closedAt);
                          const closedThreads = projectThreads.filter(t => String(t.variantId) === String(v.id) && t.closedAt);

                          // Filtrar por rol si no es comercial
                          const myActive = isComercial ? activeThreads : activeThreads.filter(t => t.type === myType);
                          const myClosed = isComercial ? closedThreads : closedThreads.filter(t => t.type === myType);

                          return (
                            <>
                              {/* 1. Hilos Activos */}
                              {myActive.map(t => (
                                <span key={t.id} className="hilos-thread-badge">
                                  {isComercial && (
                                    <span className="hilos-thread-type">
                                      {t.type === THREAD_TYPE_QUOTE ? 'Cotización' : t.type === THREAD_TYPE_DESIGN ? 'Diseño' : 'Desarrollo'}
                                    </span>
                                  )}
                                  <button type="button" className="hilos-chat-btn" onClick={() => openChat(t, selectedId, productLabel)}>
                                    Ver chat
                                  </button>
                                  <button type="button" className="hilos-close-btn" onClick={() => handleCloseThread(selectedId, t.id)} disabled={closing === t.id}>
                                    {closing === t.id ? '...' : 'Cerrar'}
                                  </button>
                                </span>
                              ))}

                              {/* 2. Botón de abrir si aplica */}
                              {!isComercial && myActive.length === 0 && canOpenThreadForVariant(v) && (
                                <button type="button" className="hilos-open-btn" onClick={() => handleOpenThread(selectedId, v.id)} disabled={opening === key}>
                                  {opening === key ? '...' : '+ Abrir hilo'}
                                </button>
                              )}

                              {/* 3. Dropdown/Botón de Historial si hay hilos cerrados */}
                              {myClosed.length > 0 && (
                                myClosed.length === 1 ? (
                                  <button
                                    type="button"
                                    className="hilos-history-btn"
                                    onClick={() => openChat(myClosed[0], selectedId, productLabel)}
                                  >
                                    Ver chat anterior
                                  </button>
                                ) : (
                                  <ThreadHistorySelect
                                    threads={myClosed}
                                    onSelect={(t) => openChat(t, selectedId, productLabel)}
                                    className="hilos-history-select"
                                  />
                                )
                              )}

                              {/* 4. Estado final si no hay nada */}
                              {!isComercial && myActive.length === 0 && myClosed.length === 0 && !canOpenThreadForVariant(v) && (
                                <span className="hilos-completed-badge">
                                  {isCotizador ? 'Cotizado' : isDisenador ? 'Diseñado' : 'Desarrollado'}
                                </span>
                              )}
                            </>
                          );
                        })()}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </main>

      {/* ── CHAT OVERLAY ── */}
      {chatOpen && (
        <div className="hilos-chat-overlay" onClick={() => setChatOpen(null)}>
          <div className="hilos-chat-modal" onClick={(e) => e.stopPropagation()}>
            <div className="hilos-chat-header">
              <h3>{chatOpen.productLabel}</h3>
              {chatOpen.closedAt && <span className="hilos-chat-closed-badge">Cerrado</span>}
              <button type="button" className="hilos-chat-close" onClick={() => setChatOpen(null)}>✕</button>
            </div>
            <div className="hilos-chat-messages">
              {loadingMessages ? (
                <p className="hilos-chat-loading">Cargando mensajes...</p>
              ) : messages.length === 0 ? (
                <p className="hilos-chat-empty">No hay mensajes aún.</p>
              ) : (
                messages.map((m) => (
                  <div key={m.id} className={`hilos-chat-msg${m.userId === user?.id ? ' hilos-chat-msg-own' : ''}`}>
                    <span className="hilos-chat-msg-meta">
                      {m.userId === user?.id ? user?.name : (userNames[m.userId] || 'Usuario')} · {formatMessageTime(m.createdAt)}
                    </span>
                    <p className="hilos-chat-msg-content">{m.content}</p>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>
            {!chatOpen.closedAt ? (
              <div className="hilos-chat-input-wrap">
                <textarea
                  className="hilos-chat-input"
                  placeholder="Escribe un mensaje... (Enter para enviar)"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSendMessage())}
                  rows={2}
                  disabled={sending}
                />
                <button type="button" className="hilos-chat-send" onClick={handleSendMessage} disabled={sending || !newMessage?.trim()}>
                  {sending ? '...' : 'Enviar'}
                </button>
              </div>
            ) : (
              <p className="hilos-chat-closed">Hilo cerrado — solo lectura.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
