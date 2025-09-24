import React, { useState, useEffect, useCallback } from 'react';
import webSocketService from '../../services/websocket';

interface Notification {
  id: string;
  message: string;
  type: 'success' | 'warning' | 'error' | 'info';
  timestamp: Date;
}

export const NotificationCenter: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const addNotification = useCallback((message: string, type: Notification['type'] = 'info') => {
    const newNotif: Notification = {
      id: `${Date.now()}-${Math.random()}`,
      message,
      type,
      timestamp: new Date(),
    };

    setNotifications(prev => [...prev, newNotif].slice(-5)); // Max 5

    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== newNotif.id));
    }, 5000);
  }, []);

  useEffect(() => {
    // Adaptation des événements WebSocket existants
    const unsubscribeDoorState = webSocketService.on('door-state-changed', (data) => {
      addNotification(`Porte ${data.isOpen ? 'ouverte' : 'fermée'}`, 'info');
    });

    const unsubscribeSensorData = webSocketService.on('sensor-data-updated', (data) => {
      // Simuler energy_metric_created basé sur sensor-data-updated
      if (data.data.energy_loss_watts && data.data.energy_loss_watts > 50) {
        addNotification(`Perte: ${data.data.energy_loss_watts.toFixed(1)}W`, 'warning');
      }
    });

    const unsubscribePoints = webSocketService.on('points-awarded', (data) => {
      const totalPoints = data.pointsAwarded?.reduce((sum: number, award: any) => sum + award.points, 0) || data.newTotal;
      addNotification(`+${totalPoints} points!`, 'success');
    });

    const unsubscribeBadge = webSocketService.on('badge-awarded', (data) => {
      addNotification(`Badge débloqué: ${data.badgeType}!`, 'success');
    });

    const unsubscribeLevelUp = webSocketService.on('level-up', (data) => {
      addNotification(`Niveau ${data.newLevel}!`, 'success');
    });

    // TODO: Ajouter temperature_alert quand disponible dans le backend
    // const unsubscribeTemperature = webSocketService.on('temperature-alert', (data) => {
    //   addNotification(`Alerte: ${data.temperature}°C`, 'error');
    // });

    return () => {
      unsubscribeDoorState();
      unsubscribeSensorData();
      unsubscribePoints();
      unsubscribeBadge();
      unsubscribeLevelUp();
      // unsubscribeTemperature();
    };
  }, [addNotification]);

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {notifications.map(notif => (
        <div
          key={notif.id}
          className={`
            p-4 rounded-lg shadow-lg min-w-[300px] animate-slide-in
            ${notif.type === 'success' ? 'bg-green-500' : ''}
            ${notif.type === 'warning' ? 'bg-yellow-500' : ''}
            ${notif.type === 'error' ? 'bg-red-500' : ''}
            ${notif.type === 'info' ? 'bg-blue-500' : ''}
            text-white
          `}
        >
          {notif.message}
        </div>
      ))}
    </div>
  );
};
