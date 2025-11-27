// 日记数据配置
// 用于管理日记页面的数据

export interface DiaryItem {
	id: number;
	content: string;
	date: string;
	images?: string[];
	location?: string;
	mood?: string;
	tags?: string[];
	title?: string;
}

// 示例日记数据（本地占位）
const diaryData: DiaryItem[] = [
];

// 远程日记 API，返回的就是 DiaryItem[] 结构
const REMOTE_DIARY_API = ""
// 获取日记统计数据
export const getDiaryStats = () => {
	const total = diaryData.length;
	const hasImages = diaryData.filter(
		(item) => item.images && item.images.length > 0,
	).length;
	const hasLocation = diaryData.filter((item) => item.location).length;
	const hasMood = diaryData.filter((item) => item.mood).length;

	return {
		total,
		hasImages,
		hasLocation,
		hasMood,
		imagePercentage: total ? Math.round((hasImages / total) * 100) : 0,
		locationPercentage: total
			? Math.round((hasLocation / total) * 100)
			: 0,
		moodPercentage: total ? Math.round((hasMood / total) * 100) : 0,
	};
};

// 获取日记列表（按时间倒序）
export const getDiaryList = (limit?: number) => {
	const sortedData = diaryData.slice().sort(
		(a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
	);

	if (limit && limit > 0) {
		return sortedData.slice(0, limit);
	}

	return sortedData;
};

// 获取最新的日记
export const getLatestDiary = () => {
	return getDiaryList(1)[0];
};

// 根据ID获取日记
export const getDiaryById = (id: number) => {
	return diaryData.find((item) => item.id === id);
};

// 获取包含图片的日记
export const getDiaryWithImages = () => {
	return diaryData.filter((item) => item.images && item.images.length > 0);
};

// 根据标签筛选日记
export const getDiaryByTag = (tag: string) => {
	return diaryData
		.filter((item) => item.tags?.includes(tag))
		.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
};

// 获取所有标签
export const getAllTags = () => {
	const tags = new Set<string>();
	diaryData.forEach((item) => {
		if (item.tags) {
			item.tags.forEach((tag) => tags.add(tag));
		}
	});
	return Array.from(tags).sort();
};

// 保持异步 API 兼容性：优先使用远程 API，失败时回退本地数据
export async function getDiaryListAsync(limit?: number): Promise<DiaryItem[]> {
	try {
		const res = await fetch(REMOTE_DIARY_API);
		if (!res.ok) throw new Error(`HTTP ${res.status}`);
		const data = (await res.json()) as DiaryItem[];
		const sorted = data
			.slice()
			.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
		return limit && limit > 0 ? sorted.slice(0, limit) : sorted;
	} catch (e) {
		console.warn("[diary] Remote fetch failed, use local diaryData:", e);
		return getDiaryList(limit);
	}
}

export async function getDiaryStatsAsync(): Promise<ReturnType<typeof getDiaryStats>> {
	try {
		const list = await getDiaryListAsync();
		const total = list.length;
		const hasImages = list.filter((item) => item.images && item.images.length > 0).length;
		const hasLocation = list.filter((item) => item.location).length;
		const hasMood = list.filter((item) => item.mood).length;
		return {
			total,
			hasImages,
			hasLocation,
			hasMood,
			imagePercentage: total ? Math.round((hasImages / total) * 100) : 0,
			locationPercentage: total ? Math.round((hasLocation / total) * 100) : 0,
			moodPercentage: total ? Math.round((hasMood / total) * 100) : 0,
		};
	} catch (e) {
		console.warn("[diary] Remote stats failed, use local stats:", e);
		return getDiaryStats();
	}
}

export default diaryData;
