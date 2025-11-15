import { useCallback, useEffect, useMemo, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import ErrorModal from '../components/ErrorModal';
import NewConversationModal from '../components/NewConversationModal';
import { useNotificationContext } from '../components/NotificationContext';
import NotificationTest from '../components/NotificationTest';
import SignupPopup from '../components/SignupPopup';
import ToolUsageModal from '../components/ToolUsageModal';
import { DEBUG } from '../env_vars';
import { useChat } from '../hooks/useChat';
import useEvents from '../hooks/useEvents';
import { useNewConversationModal } from '../hooks/useNewConversationModal';
import { useSignupPopup } from '../hooks/useSignupPopup';
import apiService from '../services/api';
import authService from '../services/auth';
import logger from '../services/logging';
import './Messages.css';
import { useTranslation } from 'react-i18next';

function truncateLastMsg(lastMessage: string, maxLength = 30): string {
  if (lastMessage.length <= maxLength) return lastMessage;
  return lastMessage.slice(0, maxLength) + '...';
}

const Messages = () => {
  const { t } = useTranslation();
  logger.debug('Messages component rendering');

  const [isAuthChecking, setIsAuthChecking] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const [toolUsageModal, setToolUsageModal] = useState({
    isOpen: false,
    usedTools: [] as string[],
  });

  const [errorModal, setErrorModal] = useState({
    isOpen: false,
    error: '',
    description: '',
    suggested_action: '' as string | undefined,
  });

  useEffect(() => {
    const checkAuth = () => {
      const authStatus = authService.isAuthenticated();
      setIsAuthenticated(authStatus);
      setIsAuthChecking(false);
    };
    checkAuth();
  }, []);

  const handleShowError = (errorState: {
    isOpen: boolean;
    error: string;
    description: string;
    suggested_action: string | undefined;
  }) => {
    setErrorModal(errorState);
  };

  const handleCloseErrorModal = () => {
    setErrorModal(prev => ({ ...prev, isOpen: false }));
  };

  const { isPopupOpen, showSignupPopup, hideSignupPopup } = useSignupPopup();
  const { isModalOpen, showModal, hideModal } = useNewConversationModal();

  const [selectedMessages, setSelectedMessages] = useState<
    { sender: string; text: string; usedTools?: string[] }[]
  >([]);

  logger.debug('Messages: isAuthenticated:', isAuthenticated);

  const {
    notifications,
    unreadCount,
    addNotification,
    markAsRead,
    markAllAsRead,
    clearNotification,
    clearAllNotifications,
    getRecentNotifications,
  } = useNotificationContext();

  const {
    conversations,
    setConversations,
    selectedConversationId,
    handleSelectConversation,
    newMessage,
    setNewMessage,
    handleSend,
    createNewConversation,
    clearConversations,
    addTestConversation,
    isLoading,
  } = useChat(false);

  const selectedConversation = useMemo(() => {
    return conversations.find(conv => conv.id === selectedConversationId);
  }, [conversations, selectedConversationId]);

  const handleNewMessage = useCallback(
    (data: any) => {
      logger.debug('Received new message notification:', data);

      addNotification({
        type: 'new_message',
        title: t('new_message'),
        message: data.text,
        timestamp: data.timestamp,
        data: {
          sender: data.sender,
          conversation_id: data.conversation_id,
        },
      });

      setConversations(prev =>
        prev.map(conv =>
          conv.id.toString() === data.conversation_id
            ? { ...conv, lastMessage: data.text }
            : conv
        )
      );

      if (selectedConversationId?.toString() === data.conversation_id) {
        if (typeof selectedConversationId === 'string') {
          const fetchMessages = async () => {
            try {
              const response = await apiService.getConversationMessages(
                selectedConversationId.toString()
              );

              const fetchedMessages = (response.messages || []).map(
                (msg: any) => ({
                  sender: msg.sender,
                  text: msg.text,
                })
              );

              setSelectedMessages(fetchedMessages);

              setConversations(prev =>
                prev.map(conv =>
                  conv.id === selectedConversationId
                    ? { ...conv, messages: fetchedMessages }
                    : conv
                )
              );
            } catch (error) {
              console.error('Error refreshing messages:', error);
            }
          };

          fetchMessages();
        }
      }
    },
    [selectedConversationId, setConversations, addNotification, t]
  );

  const handleAppointmentReminder = useCallback(
    (data: any) => {
      addNotification({
        type: 'appointment_reminder',
        title: t('appointment_reminder'),
        message: data.content,
        timestamp: data.timestamp,
        data: {
          appointmentId: data.appointmentId,
          time: data.time,
        },
      });
    },
    [addNotification, t]
  );

  const handleSystemNotification = useCallback(
    (data: any) => {
      addNotification({
        type: 'system_notification',
        title: t('system_notification'),
        message: data.content,
        timestamp: data.timestamp,
        data,
      });
    },
    [addNotification, t]
  );

  useEvents({
    onNewMessage: handleNewMessage,
    onAppointmentReminder: handleAppointmentReminder,
    onSystemNotification: handleSystemNotification,
  });
  useEffect(() => {
    let isMounted = true;

    const fetchMessages = async () => {
      if (!selectedConversationId || !selectedConversation) return;

      const isDummyConversation =
        typeof selectedConversationId === 'number' &&
        selectedConversation.messages &&
        selectedConversation.messages.length > 0;

      if (isDummyConversation) {
        if (isMounted) {
          setSelectedMessages(selectedConversation.messages);
        }
        return;
      }

      if (selectedConversation.isAI) {
        try {
          const assistantId =
            selectedConversation.participantId || 'ai-assistant';

          const response = await apiService.getLLMChatHistory(assistantId);
          const fetchedMessages = response.messages || [];

          if (isMounted) {
            const processed = fetchedMessages.map((msg: any) => ({
              sender: msg.sender,
              text: msg.text,
              usedTools: msg.usedTools || [],
            }));

            setSelectedMessages(processed);

            setConversations(prev =>
              prev.map(conv =>
                conv.id === selectedConversationId
                  ? { ...conv, messages: processed }
                  : conv
              )
            );
          }
        } catch (error) {
          console.error('Error fetching LLM messages:', error);
          if (isMounted) setSelectedMessages([]);
        }
        return;
      }

      if (typeof selectedConversationId === 'string') {
        if (
          selectedConversation.messages &&
          selectedConversation.messages.length > 0
        ) {
          if (isMounted) {
            setSelectedMessages(selectedConversation.messages);
          }
          return;
        }

        try {
          const response = await apiService.getConversationMessages(
            selectedConversationId.toString()
          );

          const fetchedMessages = (response.messages || []).map(
            (msg: any) => ({
              sender: msg.sender,
              text: msg.text,
            })
          );

          if (isMounted) {
            setSelectedMessages(fetchedMessages);

            setConversations(prev =>
              prev.map(conv =>
                conv.id === selectedConversationId
                  ? { ...conv, messages: fetchedMessages }
                  : conv
              )
            );
          }
        } catch (error) {
          console.error('Error fetching messages:', error);
          if (isMounted) setSelectedMessages([]);
        }
      } else {
        if (isMounted) {
          setSelectedMessages([]);
        }
      }
    };

    fetchMessages();

    return () => {
      isMounted = false;
    };
  }, [selectedConversationId]);

  const handleSendMessage = async () => {
    if (!isAuthenticated) {
      showSignupPopup();
      return;
    }

    if (!newMessage.trim()) return;

    setIsSendingMessage(true);

    try {
      if (selectedConversation?.isAI) {
        const assistantId =
          selectedConversation.participantId || 'ai-assistant';

        const sendResponse = await apiService.sendLLMMessage(
          assistantId,
          newMessage
        );

        const response = await apiService.getLLMChatHistory(assistantId);
        const fetchedMessages = response.messages || [];

        const processedMessages = fetchedMessages.map((msg: any) => ({
          sender: msg.sender,
          text: msg.text,
          usedTools: msg.usedTools || [],
        }));

        setSelectedMessages(processedMessages);

        setConversations(prev =>
          prev.map(conv =>
            conv.id === selectedConversationId
              ? { ...conv, messages: processedMessages }
              : conv
          )
        );
      } else {
        await handleSendUserMessage();
      }

      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);

      alert(t('error_sending_message'));

    } finally {
      setIsSendingMessage(false);
    }
  };

  const handleSendUserMessage = async () => {
    if (!newMessage.trim() || !selectedConversation) return;

    const messageText = newMessage;

    const updatedConversations = conversations.map(conv => {
      if (conv.id === selectedConversationId) {
        return {
          ...conv,
          messages: [...conv.messages, { sender: t('me'), text: messageText }],
          lastMessage: messageText,
        };
      }
      return conv;
    });

    setConversations(updatedConversations);

    if (typeof selectedConversation.id === 'string') {
      try {
        await apiService.sendMessage(
          selectedConversation.id.toString(),
          messageText
        );
      } catch (error) {
        console.error('Error sending message:', error);
      }
    }
  };

  const handleStartChatbot = () => {
    createNewConversation(
      `ai-assistant-${Date.now()}`,
      t('ai_assistant'),
      'https://ui-avatars.com/api/?name=AI&background=random',
      true
    );
  };

  const handleStartUserChat = async (
    userId: string,
    userInfo?: { display_name: string; avatar: string }
  ) => {
    try {
      const response = await apiService.createConversation(
        [userId],
        'user_to_user'
      );

      if (response.conversation_id) {
        createNewConversation(
          response.conversation_id,
          userInfo?.display_name || t('unknown_user'),
          userInfo?.avatar ||
            'https://ui-avatars.com/api/?name=User&background=random',
          false
        );
      }
    } catch (error) {
      console.error('Error creating conversation:', error);

      createNewConversation(
        userId,
        userInfo?.display_name || t('unknown_user'),
        userInfo?.avatar ||
          'https://ui-avatars.com/api/?name=User&background=random',
        false
      );
    }
  };

  const handleNewConversation = () => {
    if (!isAuthenticated) {
      showSignupPopup();
      return;
    }
    showModal();
  };
  return (
    <>
      {isAuthChecking ? (
        <div className="auth-required-container">
          <div className="auth-required-content">
            <div className="auth-required-icon">⏳</div>
            <h2>{t('loading')}</h2>
            <p>{t('checking_auth')}</p>
          </div>
        </div>
      ) : !isAuthenticated ? (
        <div className="auth-required-container">
          <div className="auth-required-content">
            <div className="auth-required-icon">🔐</div>
            <h2>{t('sign_in_required')}</h2>
            <p>{t('must_sign_in')}</p>
            <button className="auth-required-button" onClick={showSignupPopup}>
              {t('sign_in_or_sign_up')}
            </button>
          </div>
        </div>
      ) : (
        <div className="messages-container">
          {/* Left sidebar */}
          <div className="conversations-list">
            <div className="conversation-list-header">
              <h3 className="conversation-list-title">
                {t('conversations')}
              </h3>
              <div className="conversation-header-buttons">
                <button
                  className="new-conversation-button"
                  onClick={handleNewConversation}
                  title={t('start_new_conversation')}
                >
                  <span className="button-icon">+</span>
                </button>

                {DEBUG && (
                  <>
                    <button
                      className="debug-button"
                      onClick={clearConversations}
                      style={{ marginLeft: '10px', fontSize: '12px' }}
                      title={t('clear_conversations')}
                    >
                      {t('clear')}
                    </button>

                    <button
                      className="debug-button"
                      onClick={addTestConversation}
                      style={{
                        marginLeft: '5px',
                        fontSize: '12px',
                        backgroundColor: '#28a745',
                        borderColor: '#28a745',
                      }}
                      title={t('add_test_conversation')}
                    >
                      {t('test')}
                    </button>
                  </>
                )}
              </div>
            </div>

            <ul>
              {conversations.length > 0 ? (
                conversations.map(conv => (
                  <li
                    key={conv.id}
                    onClick={() => handleSelectConversation(conv.id)}
                    className={
                      conv.id === selectedConversationId
                        ? 'conversation active'
                        : 'conversation'
                    }
                  >
                    <img
                      className="avatar"
                      src={conv.avatar}
                      alt={conv.name}
                    />
                    <div className="conversation-info">
                      <p className="conversation-name">{conv.name}</p>
                      <p className="conversation-last">
                        {truncateLastMsg(conv.lastMessage)}
                      </p>
                    </div>
                  </li>
                ))
              ) : (
                <li className="no-conversations">
                  <p>{t('no_conversations')}</p>
                </li>
              )}
            </ul>
          </div>

          {/* Chat window */}
          <div className="chat-window">
            {selectedConversation ? (
              <>
                <div className="chat-header">
                  <h3>{selectedConversation.name}</h3>
                </div>

                <div className="messages-list">
                  {selectedMessages.map((msg, index) => (
                    <div
                      key={index}
                      className={msg.sender === t('me')
                        ? 'message me'
                        : 'message'
                      }
                    >
                      <div className="message-sender">
                        {msg.sender}

                        {msg.sender === t('ai_assistant') &&
                          msg.usedTools &&
                          msg.usedTools.length > 0 && (
                            <button
                              className="tool-debug-button"
                              onClick={() =>
                                setToolUsageModal({
                                  isOpen: true,
                                  usedTools: msg.usedTools || [],
                                })
                              }
                              title={t('view_tools_used')}
                            >
                              🔧
                            </button>
                          )}
                      </div>

                      <div className="message-text">
                        <ReactMarkdown>{msg.text}</ReactMarkdown>
                      </div>
                    </div>
                  ))}

                  {isLoading && (
                    <div className="message">
                      <div className="message-sender">
                        {t('ai_assistant')}
                      </div>
                      <div className="message-text">
                        <div className="loading-indicator">
                          {t('thinking')}
                        </div>
                      </div>
                    </div>
                  )}

                  {isSendingMessage && (
                    <div className="message-sending-indicator">
                      <div className="loading-spinner"></div>
                      <span>{t('sending')}</span>
                    </div>
                  )}
                </div>

                {/* Input field */}
                <div className="message-input-container">
                  <input
                    type="text"
                    placeholder={t('type_message')}
                    value={newMessage}
                    onChange={e => setNewMessage(e.target.value)}
                    onKeyPress={e => {
                      if (e.key === 'Enter' && !isSendingMessage) {
                        handleSendMessage();
                      }
                    }}
                    disabled={isSendingMessage}
                  />

                  <button
                    onClick={handleSendMessage}
                    disabled={isSendingMessage || !newMessage.trim()}
                  >
                    {isSendingMessage
                      ? t('sending')
                      : t('send')}
                  </button>
                </div>
              </>
            ) : (
              <div className="no-conversation-selected">
                <p>{t('select_conversation')}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Debug SSE */}
      {DEBUG && <NotificationTest />}
      {/* Signup popup */}
      <SignupPopup isOpen={isPopupOpen} onClose={hideSignupPopup} />

      {/* New conversation modal */}
      <NewConversationModal
        isOpen={isModalOpen}
        onClose={hideModal}
        onStartChatbot={handleStartChatbot}
        onStartUserChat={handleStartUserChat}
        onShowError={handleShowError}
      />

      {/* Error modal */}
      <ErrorModal
        isOpen={errorModal.isOpen}
        error={errorModal.error}
        description={errorModal.description}
        suggested_action={errorModal.suggested_action}
        onClose={handleCloseErrorModal}
      />

      {/* Modal showing tools used by the AI */}
      <ToolUsageModal
        isOpen={toolUsageModal.isOpen}
        usedTools={toolUsageModal.usedTools}
        onClose={() =>
          setToolUsageModal({ isOpen: false, usedTools: [] })
        }
      />
    </>
  );
};

export default Messages;
