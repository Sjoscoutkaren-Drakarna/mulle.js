const gulp = require('gulp')
const child_process = require('child_process')
const exec = require('gulp-exec');
const texturePacker = require('gulp-free-tex-packer')
const rename = require('gulp-rename')
const sass = require('gulp-sass')
const spawn = require('gulp-spawn')

function detectPython () {
  const processPy = child_process.spawnSync('python', ['-V'])
  if (processPy.output[1].toString().search('Python 3') === 0) {
    return 'python'
  }

  const processPy3 = child_process.spawnSync('python3', ['-V'])
  if (processPy3.output[1].toString().search('Python 3') === 0) {
    return 'python3'
  }
}

const python = detectPython()

gulp.task('html', function (done) {
  gulp.src('./progress/**').pipe(gulp.dest('dist/progress/'))
  gulp.src('./info/**').pipe(gulp.dest('dist/info/'))
  gulp.src('./src/index.html').pipe(gulp.dest('dist/'))
  done()
})

gulp.task('copy_data', function (done) {
  gulp.src('./cst_out_new/00.CXT/Standalone/122.bmp', { buffer: false })
    .pipe(
      spawn({
        cmd: 'magick',
        args: ['convert', '-', 'png:-'],
        filename: function (base) {
          return base + '.png'
        }
      })
    )
    .pipe(rename('loading.png')).pipe(gulp.dest('./dist/'))

  gulp.src('./data/*.json').pipe(gulp.dest('dist/data/'))
  gulp.src('./data/subtitles/**').pipe(gulp.dest('dist/data/subtitles'))

  gulp.src('./ui/*').pipe(gulp.dest('dist/ui/'))

  gulp.src('./topography/topography*').pipe(gulp.dest('dist/assets/topography/'))

  const cursors = {
    109: 'default',
    110: 'grab',
    111: 'left',
    112: 'point',
    113: 'back',
    114: 'right',
    115: 'drag_left',
    116: 'drag_right',
    117: 'drag_forward'
  }

  for (const [number, name] of Object.entries(cursors)) {
    gulp.src(`./cst_out_new/00.CXT/Standalone/${number}.png`).pipe(rename(name + '.png')).pipe(gulp.dest('dist/ui'))
  }

  /*for (let i=161; i<=191; i++) {
    gulp.src(`./cst_out_new/05.DXR/Internal/${i}.png`).pipe(gulp.dest)
  }*/

  done()
})

gulp.task('copy-info-images', function () {
  const plugin_parts = [
    22, 25, 29, 33, 36, 39, 43
  ]

  for (const [key, number] of Object.entries(plugin_parts)) {
    gulp.src(`./cst_out_new/PLUGIN.CST/Standalone/${number}.bmp`).pipe(gulp.dest('info/img'))
  }

  return gulp.src('./info/img/*.bmp')
    .pipe(exec(file => `magick convert ${file.path} ${file.path.replace('bmp', 'png')}`))
    .pipe(exec.reporter())
})

gulp.task('pack_topography', function () {
  return gulp.src('topography/30t*.png')
    .pipe(texturePacker({
      textureName: 'topography',
      removeFileExtension: true,
      prependFolderName: false,
      exporter: 'JsonHash',
      width: 2048,
      height: 2048,
      fixedSize: false,
      padding: 1,
      allowRotation: false,
      allowTrim: true,
      detectIdentical: true,
      packer: 'MaxRectsBin',
      packerMethod: 'BottomLeftRule'
    }))
    .pipe(gulp.dest('topography'))
})

gulp.task('build_topography', function () {
  const process = child_process.spawn(python, ['build_scripts/topography.py'])

  process.stdout.on('data', (data) => {
    console.log(`stdout: ${data}`)
  })
  process.stderr.on('data', (data) => {
    console.error(`stderr: ${data}`)
  })

  return process
})

gulp.task('assets', function () {
  console.log('do assets')
  const process = child_process.spawn(python, ['assets.py', '0'])

  process.stdout.on('data', (data) => {
    console.log(`assets stdout: ${data}`)
  })

  process.stderr.on('data', (data) => {
    console.error(`stderr: ${data}`)
  })
  return process
})

gulp.task('optipng', function () {
  const options = {
    continueOnError: false, // default = false, true means don't emit error event
    pipeStdout: false, // default = false, true means stdout is written to file.contents
  };
  const reportOptions = {
    err: true, // default = true, false means don't write err
    stderr: true, // default = true, false means don't write stderr
    stdout: false // default = true, false means don't write stdout
  };

  return gulp.src('./dist/assets/*.png')
    .pipe(exec(file => `optipng -o7 ${file.path}`, options))
    .pipe(exec.reporter(reportOptions));
})

gulp.task('scores', function () {
const options = {
  continueOnError: false, // default = false, true means don't emit error event
  pipeStdout: false, // default = false, true means stdout is written to file.contents
};
const reportOptions = {
  err: true, // default = true, false means don't write err
  stderr: false, // default = true, false means don't write stderr
  stdout: false // default = true, false means don't write stdout
};

return gulp.src('./Movies/8*')
  .pipe(exec(file => `${python} ./build_scripts/extract_score.py ${file.path}`, options))
  .pipe(exec.reporter(reportOptions));
})

gulp.task('scores-parse', function () {
  const reportOptions = {
    err: true, // default = true, false means don't write err
    stderr: true, // default = true, false means don't write stderr
    stdout: false // default = true, false means don't write stdout
  };

  return gulp.src('./Movies/drxtract/8*.DXR/score.json')
    .pipe(exec(file => `${python} ./build_scripts/score/score.py ${file.path}`))
    .pipe(exec.reporter(reportOptions));
})

gulp.task('scores-build', function () {
  child_process.spawn(python, ['build_scripts/score/build_score_manual.py', 'Movies/drxtract/82.DXR/score_tracks_82.DXR.json', '4', 'JustDoIt'], {'stdio': 'inherit'})
  return child_process.spawn(python, ['build_scripts/score/build_score_manual.py', 'Movies/drxtract/82.DXR/score_tracks_82.DXR.json', '5', 'JustDoIt'], {'stdio': 'inherit'})
})

gulp.task('rename', function () {
  return child_process.spawn(python, ['build_scripts/rename.py', 'cst_out_new'])
})

/*gulp.task('package', function () {
  gulp.src('./dist').pipe(exec(file=>`tar -czfO ${file.path}`))
  child_process.spawn('tar', ['-czf', '-', process.env.BUILD_LANG, ])
//  tar -czf ~/Mulle_${BUILD_LANG}.tgz -C ${TRAVIS_BUILD_DIR}/dist .
//tar -czf ~/Mulle_cst_${BUILD_LANG}.tgz -C ${TRAVIS_BUILD_DIR}/cst_out_new .

})*/

gulp.task('data-score', gulp.series('scores', 'scores-parse', 'scores-build'))
gulp.task('data', gulp.series('build_topography', 'pack_topography', 'data-score', 'copy_data'))

gulp.task('build-full', gulp.series('assets', 'optipng', 'data'))
gulp.task('build-full-no', gulp.series('rename', 'build-full'))

gulp.task('default', gulp.series('build-dev', 'assets', 'data'))
