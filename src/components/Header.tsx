import { useStore } from '../store/useStore';

export const Header = () => {
  const { unit, toggleUnit } = useStore();

  return (
    <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between shadow-sm flex-shrink-0">
      <div className="flex items-center gap-2">
        <span className="text-xl">🏠</span>
        <h1 className="text-lg font-semibold text-gray-800">Room Layout Planner</h1>
      </div>
      <button
        onClick={toggleUnit}
        className="flex items-center gap-1 bg-gray-100 hover:bg-gray-200 rounded-lg px-3 py-1.5 text-sm font-medium text-gray-700 transition-colors"
      >
        <span className={unit === 'cm' ? 'text-blue-600 font-bold' : 'text-gray-400'}>cm</span>
        <span className="text-gray-400 mx-1">|</span>
        <span className={unit === 'm' ? 'text-blue-600 font-bold' : 'text-gray-400'}>m</span>
      </button>
    </header>
  );
};
