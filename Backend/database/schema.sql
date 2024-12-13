DROP DATABASE IF EXISTS Movie_Library_DB;
CREATE DATABASE Movie_Library_DB;
USE Movie_Library_DB;

CREATE TABLE Country (
    country_id INT AUTO_INCREMENT PRIMARY KEY,
    country_name VARCHAR(50) NOT NULL
);

CREATE TABLE Person(
    person_id INT AUTO_INCREMENT PRIMARY KEY,

    country_id INT NULL,

    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    gender ENUM('male', 'female'),
    birth_year YEAR,

    FOREIGN KEY (country_id) REFERENCES Country(country_id) ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE TABLE Movie(        
    movie_id INT AUTO_INCREMENT PRIMARY KEY,

    title VARCHAR(100) NOT NULL,
    episodes INT,
    synopsis TEXT DEFAULT NULL,
    score DECIMAL(3, 1) DEFAULT NULL
);

CREATE TABLE User(
    user_id INT AUTO_INCREMENT PRIMARY KEY,

    email VARCHAR(50) NOT NULL UNIQUE,
    username VARCHAR(20) NOT NULL UNIQUE,
    password VARCHAR(200) NOT NULL,
    access_level ENUM('user', 'moderator', 'admin') DEFAULT 'user'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE Score (
    movie_id INT NOT NULL,
    user_id INT NOT NULL,

    score DECIMAL(2, 1) NOT NULL,

    PRIMARY KEY (user_id, movie_id),
    FOREIGN KEY (movie_id) REFERENCES Movie(movie_id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (user_id) REFERENCES User(user_id) ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE Director(
    person_id INT NOT NULL,
    movie_id INT NOT NULL,

    PRIMARY KEY (person_id, movie_id),
    FOREIGN KEY (person_id) REFERENCES Person(person_id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (movie_id) REFERENCES Movie(movie_id) ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE Review(
    user_id INT NOT NULL,
    movie_id INT NOT NULL,

    review TEXT DEFAULT NULL,

    PRIMARY KEY (user_id, movie_id),
    FOREIGN KEY(user_id) REFERENCES User(user_id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY(movie_id) REFERENCES Movie(movie_id) ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE Genre (
    genre_id INT AUTO_INCREMENT PRIMARY KEY,
    genre_name VARCHAR(50) NOT NULL UNIQUE
);

CREATE TABLE Movie_Genre(
    movie_id INT NOT NULL,
    genre_id INT NOT NULL,

    PRIMARY KEY (movie_id, genre_id),
    FOREIGN KEY (movie_id) REFERENCES Movie(movie_id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (genre_id) REFERENCES Genre(genre_id) ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE Cast(
    cast_id INT AUTO_INCREMENT PRIMARY KEY,

    person_id INT NOT NULL,
    movie_id INT NOT NULL,

    cast_name VARCHAR(20) NOT NULL,

    FOREIGN KEY (person_id) REFERENCES Person(person_id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (movie_id) REFERENCES Movie(movie_id) ON DELETE CASCADE ON UPDATE CASCADE
);