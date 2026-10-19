declare module "*.png" {
	const value: string;
	export default value;
}
declare module "*.gif" {
	const value: string;
	export default value;
}
declare module "*.mp3" {
	const value: string;
	export default value;
}
declare module "virtual:pet-assets" {
	export const petAssets: Record<string, Record<string, string>>;
}
