/**
 * Tag 辅助函数
 * 将后端返回的 tag 字符串映射到前端的颜色样式
 */

// 预定义的 tag 颜色映射
const TAG_COLORS: Record<string, string> = {
  'Design': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
  'Development': 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
  'Meeting': 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300',
  'Marketing': 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-300',
  'Research': 'bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-300',
  'Bug': 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
  'Feature': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
  'Documentation': 'bg-slate-100 text-slate-800 dark:bg-slate-900 dark:text-slate-300',
  'UI/UX': 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300',
  'Planning': 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300',
};

// 默认颜色（当 tag 不在预定义列表中时使用）
const DEFAULT_COLOR = 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';

/**
 * 根据 tag 名称获取对应的颜色样式
 */
export const getTagColor = (tagName: string): string => {
  return TAG_COLORS[tagName] || DEFAULT_COLOR;
};

/**
 * 获取所有可用的 tag 列表（用于创建/编辑表单）
 */
export const getAvailableTags = (): string[] => {
  return Object.keys(TAG_COLORS);
};
