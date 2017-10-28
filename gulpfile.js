const gulp = require("gulp");
const gutil = require("gulp-util");
const browserify = require("browserify");
const source = require("vinyl-source-stream");
const buffer = require("vinyl-buffer");
const tsify = require("tsify");
const watchify = require("watchify");
const browserSync = require("browser-sync").create();
const historyApiFallback = require("connect-history-api-fallback");
const sourcemaps = require("gulp-sourcemaps");
const uglify = require("gulp-uglify");
const envify = require("envify");
const bundleCollapser = require("bundle-collapser/plugin");
const sass = require('gulp-sass');
const cache = require("gulp-cached");
const remember = require("gulp-remember");
const autoprefixer = require("gulp-autoprefixer");
const minifyCSS = require("gulp-minify-css");


// defining standard paths
const paths = {
	scripts: ["src/**/*.ts", "src/**/*.tsx"],
	images: "src/img/*",
	html: ["src/**/*.html"],
	fonts: ["src/fonts/**/*.*"],
	styles: ["src/styles/index.scss"],
	i18n: ["src/i18n/**/*.json"],
	data: ["src/data/**/*.json"]
};

// instanciate the tsified-browserify bundler
const bundler = browserify({
	basedir: "./src",
	debug: true,
	entries: ["index.tsx"],
	cache: {},
	packageCache: {},
}).plugin(tsify)
.transform(envify, {
	_: "purge",
	// injected envvars
	NODE_ENV: process.env.NODE_ENV,
	__DEV__: process.env.NODE_ENV !== "production",
}).plugin(bundleCollapser);

// and watchify the bundler
const watcher = watchify(bundler);
watcher.on("update", watchBuild);
watcher.on("log", gutil.log);

// Copy static html files
function copyHtml() {
	return gulp.src(paths.html)
		.pipe(gulp.dest("dist"));
}

// Copy static i18n files
function copyi18N() {
	return gulp.src(paths.i18n)
		.pipe(gulp.dest("dist/i18n"));
}

// Copy static data files
function copyData() {
	return gulp.src(paths.data)
		.pipe(gulp.dest("dist/data"));
}

// Copy static font files
function copyFonts() {
	return gulp.src(paths.fonts)
		.pipe(gulp.dest("dist/fonts"));
}

function copyAndReloadHtml() {
	return copyHtml().pipe(browserSync.reload({stream: true}));
}

// production build for the js bundle
function build() {
	return bundler
		.bundle()
		.on("error", (err) => { console.error("A typescript error occurred: \n", err); process.exit(1); })
		.pipe(source("bundle.js"))
		.pipe(buffer())
		.pipe(uglify())
		.pipe(gulp.dest("dist"));
}

// watch-mode: build the js bundle
function watchBuild() {
	return watcher
		.bundle()
		.on("error", (err) => { console.error("A typescript error occurred: \n", err) })
		.pipe(source("bundle.js"))
		.pipe(buffer())
		.pipe(sourcemaps.init({loadMaps: true})) // loads map from browserify file
		.pipe(sourcemaps.write("./")) // writes .map file
		.pipe(gulp.dest("dist"))
		.on("end", () => {
			browserSync.reload();
		});
}

// compile scss to css
function compileStyles() {
	return gulp.src(paths.styles)
		.pipe(cache("sass"))
		.pipe(remember("scripts")) // add back all files to the stream
		.pipe(sass())
		.pipe(autoprefixer({
			cascade: false,
			browsers: ["last 2 versions"],
		}));
}

function compileStylesMinify() {
	return compileStyles()
		.pipe(minifyCSS({
			keepBreaks: false,
			keepSpecialComments: false,
		}));
}

function buildStyles() {
	return compileStyles()
		.pipe(gulp.dest("./dist/css"))
		.on("error", gutil.log);
}

function buildStylesMinify() {
	return compileStylesMinify()
		.pipe(gulp.dest("./dist/css"))
		.on("error", gutil.log);
}

// less with browserSync
function syncStyles() {
	return buildStyles()
		.pipe(browserSync.reload({ stream: true }));
}

// static browsersync server with live-reloading goodness :3
function serveBrowserSync() {
	const port = process.env.PORT
		? parseInt(process.env.PORT, 10)
		: 3000;

	browserSync.init({
		server: {
			port: port,
			baseDir: "./dist",
			middleware: [
				historyApiFallback({
					rewrites: [
						{ from: /bundle\.js$/, to: () => `/bundle.js` },
					],
				})
			],
		}
	});
}

gulp.task("copy-html", copyHtml);
gulp.task("copy-i18n", copyi18N);
gulp.task("copy-data", copyData);
gulp.task("copy-fonts", copyFonts);
gulp.task("copy-and-reload-html", copyAndReloadHtml);
gulp.task("prod-build", build)
gulp.task("watch-build", watchBuild);
gulp.task("sass-build", buildStyles);
gulp.task("sass-build-minified", buildStylesMinify);
gulp.task("sass-browsersync", syncStyles);
gulp.task("browser-sync", serveBrowserSync);
gulp.task("default", ["copy-html", "build"]);

gulp.task("watch", ["copy-html", "copy-fonts", "copy-i18n","copy-data", "sass-build", "watch-build", "browser-sync"], () => {
	gulp.watch(paths.styles, ["sass-browsersync"]);
	gulp.watch(paths.html, ["copy-and-reload-html"]);
});

gulp.task("build", ["copy-html", "copy-fonts", "copy-i18n", "sass-build-minified", "prod-build"], () => {
	process.exit(0);
});