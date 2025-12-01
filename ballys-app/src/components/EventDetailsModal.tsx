import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Clock, MapPin, Calendar as CalendarIcon, FileText, Edit2, CalendarPlus, Download, Zap, MessageSquare, Send, ThumbsUp, Trash2 } from 'lucide-react';
import type { AdminEvent, Interaction, User } from '../types';
import { generateOutlookCalendarUrl, downloadICS } from '../services/calendarService';
import { interactionService } from '../services/interactionService';
import { userService } from '../services/userService';

interface EventDetailsModalProps {
  event: AdminEvent | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit?: (event: AdminEvent) => void;
}

export default function EventDetailsModal({ event, isOpen, onClose, onEdit }: EventDetailsModalProps) {
  const [isCopied, setIsCopied] = useState(false);

  // Interaction State
  const [auraCount, setAuraCount] = useState(0);
  const [hasAura, setHasAura] = useState(false);
  const [comments, setComments] = useState<Interaction[]>([]);
  const [commentText, setCommentText] = useState('');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    if (isOpen && event) {
      const loadInteractions = async () => {
        const data = await interactionService.getEventInteractions(event.id);
        setAuraCount(data.auraCount);
        setHasAura(data.hasUserAura);
        setComments(data.comments);
        setIsOffline(data.isOffline);
        if (data.currentUser) {
          setCurrentUser(data.currentUser);
        } else {
          setCurrentUser(userService.getCurrentUser());
        }
      };
      loadInteractions();
    } else {
      // Reset state
      setAuraCount(0);
      setHasAura(false);
      setComments([]);
      setCommentText('');
      setIsOffline(false);
    }
  }, [isOpen, event]);

  const handleAddAura = async () => {
    if (!event || hasAura) return;

    // Optimistic UI update
    setHasAura(true);
    setAuraCount(prev => prev + 1);

    const success = await interactionService.addAura(event.id);
    if (!success) {
      // Revert if failed
      setHasAura(false);
      setAuraCount(prev => prev - 1);
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!event || !commentText.trim()) return;

    const text = commentText.trim();
    setCommentText(''); // Clear immediately

    // Optimistic Update
    const tempId = 'temp-' + Date.now();
    const optimisticComment: Interaction = {
      id: tempId,
      event_id: event.id,
      user_id: currentUser?.id || 'temp',
      type: 'comment',
      content: text,
      created_at: new Date().toISOString(),
      username: currentUser?.username || 'Guest',
      likes: 0,
      hasLiked: false
    };

    setComments(prev => [optimisticComment, ...prev]);

    try {
      const newComment = await interactionService.addComment(event.id, text);
      if (newComment) {
        // Replace optimistic comment with real one
        setComments(prev => prev.map(c => c.id === tempId ? newComment : c));
      } else {
        // Failed, remove optimistic comment and restore text
        setComments(prev => prev.filter(c => c.id !== tempId));
        setCommentText(text);
      }
    } catch (error) {
      // Error, remove optimistic comment and restore text
      setComments(prev => prev.filter(c => c.id !== tempId));
      setCommentText(text);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    // Optimistic update
    const prevComments = [...comments];
    setComments(prev => prev.filter(c => c.id !== commentId));

    const success = await interactionService.deleteInteraction(commentId);
    if (!success) {
      // Revert
      setComments(prevComments);
      alert("Failed to delete comment");
    }
  };

  const handleToggleLike = async (commentId: string) => {
    // Find comment
    const comment = comments.find(c => c.id === commentId);
    if (!comment) return;

    // Optimistic update
    const newHasLiked = !comment.hasLiked;
    const newLikes = newHasLiked ? (comment.likes || 0) + 1 : (comment.likes || 0) - 1;

    setComments(prev => prev.map(c => c.id === commentId ? { ...c, hasLiked: newHasLiked, likes: newLikes } : c));

    const success = await interactionService.toggleLike(commentId);
    if (!success) {
      setComments(prev => prev.map(c => c.id === commentId ? { ...c, hasLiked: !newHasLiked, likes: comment.likes } : c));
    }
  };

  if (!event) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl max-w-2xl w-full relative overflow-hidden border border-slate-200 dark:border-slate-700 max-h-[90vh] flex flex-col"
          >
            {/* Header */}
            <div className="relative h-32 md:h-40 bg-gradient-to-r from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700 shrink-0">
              {/* Abstract Pattern */}
              <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#000_1px,transparent_1px)] [background-size:16px_16px]"></div>

              <div className="absolute top-4 right-4 flex gap-2 z-10">
                {isOffline && (
                  <div className="px-3 py-2 bg-yellow-500/90 text-white rounded-full text-[10px] font-bold uppercase tracking-wider shadow-sm backdrop-blur-sm flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                    Offline Mode
                  </div>
                )}
                {onEdit && (
                  <button
                    onClick={() => {
                      onClose();
                      onEdit(event);
                    }}
                    className="px-3 py-2 bg-white/50 dark:bg-black/50 hover:bg-white dark:hover:bg-black rounded-full transition-colors backdrop-blur-sm flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200"
                  >
                    <Edit2 className="w-4 h-4" />
                    <span className="hidden sm:inline">Edit Event</span>
                  </button>
                )}
                <button
                  onClick={onClose}
                  className="p-2 bg-white/50 dark:bg-black/50 hover:bg-white dark:hover:bg-black rounded-full transition-colors backdrop-blur-sm"
                >
                  <X className="w-5 h-5 text-slate-700 dark:text-slate-200" />
                </button>
              </div>

              <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-white dark:from-slate-900 to-transparent pt-16">
                <div className="flex items-end justify-between gap-4">
                  <div className="flex-1">
                    {event.property && event.property !== 'Both' && (
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded mb-2 inline-block shadow-sm ${event.property === 'Lincoln'
                        ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'
                        : 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400'
                        }`}>
                        {event.property === 'Lincoln' ? "Bally's Lincoln" : "Bally's Tiverton"}
                      </span>
                    )}
                    <h2 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white leading-tight">
                      {event.title}
                    </h2>
                  </div>

                  {/* Aura Button */}
                  <button
                    onClick={handleAddAura}
                    disabled={hasAura}
                    className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all ${hasAura
                      ? 'bg-ballys-gold/20 text-yellow-600 dark:text-yellow-400 cursor-default'
                      : 'bg-white/50 dark:bg-black/30 hover:bg-white dark:hover:bg-black/50 text-slate-500 dark:text-slate-400 hover:scale-105 active:scale-95'
                      }`}
                  >
                    <Zap className={`w-6 h-6 ${hasAura ? 'fill-current' : ''}`} />
                    <span className="text-[10px] font-bold uppercase tracking-wider">{auraCount > 0 ? auraCount : 'Aura'}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Content - Scrollable */}
            <div className="p-6 md:p-8 overflow-y-auto custom-scrollbar flex-1">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                {/* Date/Time */}
                <div className="flex items-start gap-3 text-slate-600 dark:text-slate-300">
                  <CalendarIcon className="w-5 h-5 text-slate-400 mt-0.5" />
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-0.5">Date</p>
                    <p className="text-sm font-medium">
                      {event.startDate ? new Date(event.startDate + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }) : 'N/A'}
                    </p>
                  </div>
                </div>

                {/* Time */}
                {(event.startTime || event.endTime) && (
                  <div className="flex items-start gap-3 text-slate-600 dark:text-slate-300">
                    <Clock className="w-5 h-5 text-slate-400 mt-0.5" />
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-0.5">Time</p>
                      <p className="text-sm font-medium">
                        {event.startTime ? (
                          <>
                            {new Date(`2000-01-01T${event.startTime}`).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
                            {event.endTime && ` - ${new Date(`2000-01-01T${event.endTime}`).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`}
                          </>
                        ) : 'All Day'}
                      </p>
                    </div>
                  </div>
                )}

                {/* Location if available in meta */}
                {event.meta?.find(m => m.label === 'WHERE') && (
                  <div className="flex items-start gap-3 text-slate-600 dark:text-slate-300">
                    <MapPin className="w-5 h-5 text-slate-400 mt-0.5" />
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-0.5">Location</p>
                      <p className="text-sm font-medium">{event.meta.find(m => m.label === 'WHERE')?.value}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Add to Calendar Actions */}
              <div className="flex flex-wrap gap-3 mb-8">
                <button
                  onClick={() => {
                    const text = [
                      event.title,
                      event.property && event.property !== 'Both' ? (event.property === 'Lincoln' ? "Bally's Lincoln" : "Bally's Tiverton") : null,
                      '',
                      event.startDate ? new Date(event.startDate + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }) : null,
                      event.startTime ? `${new Date(`2000-01-01T${event.startTime}`).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}${event.endTime ? ` - ${new Date(`2000-01-01T${event.endTime}`).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}` : ''}` : 'All Day',
                      '',
                      event.description,
                      event.details && event.details.length > 0 ? '\nDetails:' : null,
                      event.details?.map(d => `• ${d}`).join('\n'),
                      event.meta && event.meta.length > 0 ? '\nMore Info:' : null,
                      event.meta?.map(m => `${m.label}: ${m.value}`).join('\n')
                    ].filter(Boolean).join('\n');

                    navigator.clipboard.writeText(text);

                    setIsCopied(true);
                    setTimeout(() => setIsCopied(false), 2000);
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 dark:bg-slate-800 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-sm"
                >
                  <FileText className={`w-4 h-4 ${isCopied ? 'text-green-500' : 'text-purple-500'} transition-colors`} />
                  <span>{isCopied ? 'Copied!' : 'Copy Details'}</span>
                </button>
                <a
                  href={generateOutlookCalendarUrl(event)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 dark:bg-slate-800 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-sm"
                >
                  <CalendarPlus className="w-4 h-4 text-blue-400" />
                  Add to Outlook
                </a>
                <button
                  onClick={() => downloadICS(event)}
                  className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 dark:bg-slate-800 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-sm"
                >
                  <Download className="w-4 h-4 text-green-500" />
                  Download .ICS File
                </button>
              </div>

              <div className="space-y-6">
                {event.description && (
                  <div className="prose dark:prose-invert max-w-none">
                    <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                      {event.description}
                    </p>
                  </div>
                )}

                {event.details && event.details.length > 0 && (
                  <ul className="space-y-3 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl">
                    {event.details.map((detail, idx) => (
                      <li key={idx} className="flex items-start gap-3 text-sm text-slate-600 dark:text-slate-300">
                        <span className="mt-2 w-1.5 h-1.5 rounded-full shrink-0 bg-red-500" />
                        <span className="leading-relaxed">{detail}</span>
                      </li>
                    ))}
                  </ul>
                )}

                {event.media && event.media.length > 0 && (
                  <div className="grid grid-cols-2 gap-4 mt-6">
                    {event.media.map((item, idx) => (
                      <div key={idx} className="relative rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 group">
                        {item.type === 'image' ? (
                          <div className="aspect-video relative cursor-pointer" onClick={() => window.open(item.url, '_blank')}>
                            <img src={item.url} alt={item.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                              <span className="text-xs font-bold uppercase tracking-wider text-white bg-black/50 px-3 py-1.5 rounded-full backdrop-blur-md">View Fullsize</span>
                            </div>
                          </div>
                        ) : (
                          <a href={item.url} download={item.name} className="flex flex-col items-center justify-center p-6 gap-3 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors aspect-video text-center">
                            <FileText className="w-10 h-10 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-200 transition-colors" />
                            <span className="text-sm font-medium text-slate-600 dark:text-slate-300 truncate w-full px-2">{item.name}</span>
                            <span className="text-[10px] uppercase tracking-wider text-slate-500 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-2 py-1 rounded-full">Download PDF</span>
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Additional Meta */}
                {event.meta && event.meta.filter(m => m.label !== 'WHERE').length > 0 && (
                  <div className="flex flex-wrap gap-3 pt-6 border-t border-slate-100 dark:border-slate-800">
                    {event.meta.filter(m => m.label !== 'WHERE').map((meta, idx) => (
                      <div key={idx} className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{meta.label}</span>
                        <span className="text-xs text-slate-700 dark:text-slate-200 font-medium">{meta.value}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Comments Section */}
                <div className="pt-8 mt-8 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2 mb-6">
                    <MessageSquare className="w-4 h-4 text-slate-400" />
                    <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500">Discussion</h3>
                  </div>

                  {/* Comment Input */}
                  <form onSubmit={handleAddComment} className="mb-8 relative">
                    <div className="flex gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-ballys-red to-purple-600 flex items-center justify-center shrink-0 text-white text-xs font-bold border-2 border-white dark:border-slate-900 shadow-sm">
                        {currentUser?.username.charAt(0).toUpperCase() || 'G'}
                      </div>
                      <div className="flex-1">
                        <div className="relative">
                          <input
                            type="text"
                            value={commentText}
                            onChange={(e) => setCommentText(e.target.value)}
                            placeholder={`Comment as ${currentUser?.username || 'Guest'}...`}
                            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 pr-12 text-sm focus:outline-none focus:ring-2 focus:ring-ballys-red/20 focus:border-ballys-red transition-all"
                          />
                          <button
                            type="submit"
                            disabled={!commentText.trim()}
                            className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-lg bg-ballys-red text-white disabled:opacity-50 disabled:bg-slate-200 dark:disabled:bg-slate-700 transition-all hover:scale-105 active:scale-95"
                          >
                            <Send className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <p className="text-[10px] text-slate-400 mt-2 ml-1">
                          Playing as <span className="font-bold text-slate-600 dark:text-slate-300">{currentUser?.username}</span>
                        </p>
                      </div>
                    </div>
                  </form>

                  {/* Comments List */}
                  <div className="space-y-6">
                    {comments.length === 0 ? (
                      <p className="text-center text-sm text-slate-400 italic py-4">Be the first to share your thoughts!</p>
                    ) : (
                      comments.map((comment) => (
                        <div key={comment.id} className="flex gap-3 group/comment">
                          <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0 text-slate-500 text-xs font-bold border border-slate-200 dark:border-slate-700">
                            {comment.username ? comment.username.charAt(0).toUpperCase() : '?'}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-baseline justify-between mb-1">
                              <div className="flex items-baseline gap-2">
                                <span className="text-sm font-bold text-slate-700 dark:text-slate-200">{comment.username || 'Anonymous'}</span>
                                <span className="text-[10px] text-slate-400">
                                  {new Date(comment.created_at).toLocaleDateString()}
                                </span>
                              </div>
                              {(currentUser && (currentUser.id === comment.user_id || currentUser.username === 'Admin')) && (
                                <button
                                  onClick={() => handleDeleteComment(comment.id)}
                                  className="opacity-0 group-hover/comment:opacity-100 transition-opacity p-1 text-slate-400 hover:text-red-500"
                                  title="Delete Comment"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              )}
                            </div>
                            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-slate-800/50 px-3 py-2 rounded-lg rounded-tl-none mb-1">
                              {comment.content}
                            </p>

                            {/* Like Button */}
                            <div className="flex items-center gap-2 ml-1">
                              <button
                                onClick={() => handleToggleLike(comment.id)}
                                className={`flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider transition-colors ${comment.hasLiked ? 'text-blue-500' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
                              >
                                <ThumbsUp className={`w-3 h-3 ${comment.hasLiked ? 'fill-current' : ''}`} />
                                <span>{comment.likes || 0}</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
