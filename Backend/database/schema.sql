DROP DATABASE Movie_Library_DB;
CREATE DATABASE Movie_Library_DB;
USE Movie_Library_DB;

CREATE TABLE Person(
    person_id INT AUTO_INCREMENT PRIMARY KEY,

    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    gender ENUM('male', 'female'),
    birth_year YEAR,
    birth_country VARCHAR(50)
);

CREATE TABLE Movie(
    movie_id INT AUTO_INCREMENT PRIMARY KEY,

    title VARCHAR(100) NOT NULL,
    episodes INT DEFAULT 1,
    synopsis TEXT,
    rating DECIMAL(3,1) DEFAULT NULL
);

CREATE TABLE User(
    user_id INT AUTO_INCREMENT PRIMARY KEY,

    email VARCHAR(50) NOT NULL UNIQUE,
    username VARCHAR(20) NOT NULL UNIQUE,
    password VARCHAR(200) NOT NULL,
    access_level ENUM('user', 'moderator', 'admin') DEFAULT 'user' -- mozna usunac DEFAULT 'user' BO I TAK SPRAWDZA SIE POTEM
);

CREATE TABLE Director(
    person_id INT NOT NULL,
    movie_id INT NOT NULL,

    PRIMARY KEY (person_id, movie_id),
    FOREIGN KEY (person_id) REFERENCES Person(person_id),
    FOREIGN KEY (movie_id) REFERENCES Movie(movie_id)
);

CREATE TABLE Rating(
    user_id INT NOT NULL,
    movie_id INT NOT NULL,

    score INT CHECK (score BETWEEN 1 AND 10),
    review TEXT,

    PRIMARY KEY (user_id, movie_id),
    FOREIGN KEY(user_id) REFERENCES User(user_id),
    FOREIGN KEY(movie_id) REFERENCES Movie(movie_id)
);

CREATE TABLE Genre(
    movie_id INT NOT NULL,

    genre VARCHAR(20) NOT NULL,

    FOREIGN KEY (movie_id) REFERENCES Movie(movie_id)
);

CREATE TABLE Role(
    role_id INT AUTO_INCREMENT PRIMARY KEY,

    person_id INT NOT NULL,
    movie_id INT NOT NULL,

    role VARCHAR(20) NOT NULL,

    FOREIGN KEY (person_id) REFERENCES Person(person_id),
    FOREIGN KEY (movie_id) REFERENCES Movie(movie_id)
);