import Webpack from "webpack";
import Path from "path";
import TsconfigPathsWebpackPlugin from "tsconfig-paths-webpack-plugin"; // makes webpack use the paths option in tsconfig
import HtmlWebpackPlugin from "html-webpack-plugin"; // bundles assets into one html file
import MiniCssExtractPlugin from "mini-css-extract-plugin"; // minimizes css files
import OptimizeCssAssetsPlugin from "optimize-css-assets-webpack-plugin"; // removes duplicate selectors in css files by hooking mini-css-extract-plugin loader

const factory: Webpack.ConfigurationFactory = (env, args): Webpack.Configuration => {
	const outputPath = Path.resolve(__dirname, "build");
	const config: Webpack.Configuration = {
		context: Path.resolve(__dirname),
		entry: "./src/index.tsx",
		output: {
			filename: "index.js",
			path: outputPath // must be an absolute path
		},
		resolve: {
			// locates modules of file or directory that are included by import(or require)
			// It locates modules by their absolute paths, so every relative path gets converted into absolute path.
			// The modules option specifies directories to search for module import.
			// If the module is a file, then it gets bundled, otherwise files of extensions in the extensions option in the directory get bundled.
			extensions: [".ts", ".tsx", ".js"],
			plugins: [new TsconfigPathsWebpackPlugin()] // uses the paths option in tsconfig instead of using the resolve.modules option
		},
		plugins: [
			new MiniCssExtractPlugin({ // won't be able to use style-loader
				filename: "index.css", // relative to output.filename
			}),
			new OptimizeCssAssetsPlugin(), // if it's in optimization.minimizer property, webpack-dev-server won't apply it.
			new HtmlWebpackPlugin({
				filename: "index.html", // relative to output.filename
				template: "src/index.html" // relative to context
			})
		],
		module: {
			rules: [
				{
					test: /\.tsx?$/,
					exclude: /node_modules/,
					use: [
						"babel-loader",
						"ts-loader"
					]
				},
				{
					test: /\.jsx?$/,
					exclude: /node_modules/,
					use: [
						"babel-loader"
					]
				},
				{
					test: /\.s[ac]ss$/,
					use: [
						MiniCssExtractPlugin.loader,
						"css-loader",
						"resolve-url-loader",
						"sass-loader"
					]
				},
				{
					test: /\.css$/,
					use: [
						MiniCssExtractPlugin.loader,
						"css-loader"
					]
				}
			]
		},
		devtool: "source-map",
		devServer: {
			contentBase: outputPath,
			watchContentBase: true,
			compress: true,
			port: 3000,
			proxy: {
				"/api": "http://localhost:8080"
			},
			hot: true,
			stats: {
				colors: true,
				version: false,
				hash: false,
				assets: false,
				timings: false,
				children: false, // children are plugins that are applied to webpack like mini-css-extract-plugin
				entrypoints: false,
				cached: false,
				cachedAssets: false,
				exclude: [
					/node_modules/,
					/webpack/
				]
			}
		}
	};

	return config;
};

export default factory;