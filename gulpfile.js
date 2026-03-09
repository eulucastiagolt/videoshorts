const gulp = require('gulp');
const terser = require('gulp-terser');
const cleanCSS = require('gulp-clean-css');
const rename = require('gulp-rename');

function minifyJS() {
  return gulp
    .src('videoshots.js')
    .pipe(terser({
      format: {
        comments: /^!/
      }
    }))
    .pipe(rename({ suffix: '.min' }))
    .pipe(gulp.dest('dist'));
}

function minifyCSS() {
  return gulp
    .src('videoshots.css')
    .pipe(cleanCSS())
    .pipe(rename({ suffix: '.min' }))
    .pipe(gulp.dest('dist'));
}

exports.default = gulp.parallel(minifyJS, minifyCSS);
exports.build = gulp.parallel(minifyJS, minifyCSS);