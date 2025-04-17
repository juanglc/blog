pipeline {
    agent any

    environment {
        COMPOSE_PROJECT_NAME = "blog_project"
    }

    stages {
        stage('Prepare') {
            steps {
                echo 'Cleaning old containers (if any)...'
                sh 'docker-compose down || true'
            }
        }

        stage('Build Backend') {
            steps {
                dir('backend') {
                    echo 'Building Django Backend Docker Image...'
                    sh 'docker build -t backend-app .'
                }
            }
        }

        stage('Build Frontend') {
            steps {
                dir('frontend') {
                    echo 'Building React Frontend Docker Image...'
                    sh 'docker build -t frontend-app .'
                }
            }
        }

        stage('Deploy') {
            steps {
                echo 'Starting containers with docker-compose...'
                sh 'docker-compose up -d --build'
            }
        }
    }

    post {
        failure {
            echo 'Build failed!'
        }
        success {
            echo 'Deployment completed successfully!'
        }
    }
}
