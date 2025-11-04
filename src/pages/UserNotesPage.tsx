import React from 'react';
import UserNotesScreen from '../components/UserNotes';

const UserNotesPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden dark:bg-gray-800 dark:border dark:border-gray-700">
          <UserNotesScreen />
        </div>
      </div>
    </div>
  );
};

export default UserNotesPage;
