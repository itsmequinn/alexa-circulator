module.exports = function(grunt) {
    // Project configuration.

    var DISTDIR = 'bin';

    grunt.initConfig({

        pkg: grunt.file.readJSON('package.json'),

        compress: {
            dist: {
                options: {
                    archive: 'circulator-<%= pkg.version %>.zip'
                },
                files: [
                    {expand: true, cwd: 'src/', src: ['**']},
                    {expand: true, src: ['node_modules/**']}
                ]
            }
        },
        clean: {
            dist: ['*.zip']
        }
    });

    // Load the plugin that provides the "docular" tasks.
    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-contrib-compress');

    grunt.registerTask('default', 'Alias for build', ['clean', 'compress']);
};