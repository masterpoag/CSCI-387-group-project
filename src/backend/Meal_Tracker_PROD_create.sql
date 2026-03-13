-- Created by Redgate Data Modeler (https://datamodeler.redgate-platform.com)
-- Last modification date: 2026-03-12 21:28:10.448

-- tables
-- Table: Admin
CREATE TABLE Admin (
    aid int  NOT NULL AUTO_INCREMENT,
    User_uid int  NOT NULL,
    CONSTRAINT Admin_pk PRIMARY KEY (aid)
);

-- Table: Food
CREATE TABLE Food (
    fid int  NOT NULL AUTO_INCREMENT,
    cal int  NOT NULL,
    name varchar(30)  NOT NULL,
    CONSTRAINT Food_pk PRIMARY KEY (fid)
) COMMENT 'Assumes a default portion size';

-- Table: Quanity
CREATE TABLE Quanity (
    Food_fid int  NOT NULL,
    Recipe_rid int  NOT NULL,
    qty decimal(10,10)  NOT NULL,
    CONSTRAINT Quanity_pk PRIMARY KEY (Food_fid,Recipe_rid)
) COMMENT 'Recipe Food Bridge Entity';

-- Table: Recipe
CREATE TABLE Recipe (
    rid int  NOT NULL AUTO_INCREMENT,
    name varchar(30)  NOT NULL,
    `desc` varchar(200)  NULL,
    instruct text  NULL,
    isPublic bool  NOT NULL,
    pid int  NOT NULL COMMENT 'FK',
    User_uid int  NOT NULL,
    CONSTRAINT Recipe_pk PRIMARY KEY (rid)
);

-- Table: User
CREATE TABLE User (
    uid int  NOT NULL AUTO_INCREMENT,
    uname varchar(20)  NOT NULL,
    pass varchar(64)  NOT NULL,
    createTime bigint  UNSIGNED NOT NULL,
    wieght double(5,2)  NOT NULL,
    account_type int  NOT NULL,
    isMetric bool  NOT NULL,
    cal_goal int  NULL,
    CONSTRAINT User_pk PRIMARY KEY (uid)
);

-- Table: Workout
CREATE TABLE Workout (
    wid int  NOT NULL AUTO_INCREMENT,
    User_uid int  NOT NULL,
    instructions text  NOT NULL,
    cal int  NOT NULL,
    isPublic bool  NOT NULL,
    CONSTRAINT Workout_pk PRIMARY KEY (wid)
);

-- foreign keys
-- Reference: Admin_User (table: Admin)
ALTER TABLE Admin ADD CONSTRAINT Admin_User FOREIGN KEY Admin_User (User_uid)
    REFERENCES User (uid);

-- Reference: Recipe_User (table: Recipe)
ALTER TABLE Recipe ADD CONSTRAINT Recipe_User FOREIGN KEY Recipe_User (User_uid)
    REFERENCES User (uid);

-- Reference: Workout_User (table: Workout)
ALTER TABLE Workout ADD CONSTRAINT Workout_User FOREIGN KEY Workout_User (User_uid)
    REFERENCES User (uid);

-- Reference: portion_Recipe (table: Quanity)
ALTER TABLE Quanity ADD CONSTRAINT portion_Recipe FOREIGN KEY portion_Recipe (Recipe_rid)
    REFERENCES Recipe (rid);

-- Reference: rec_food_Food (table: Quanity)
ALTER TABLE Quanity ADD CONSTRAINT rec_food_Food FOREIGN KEY rec_food_Food (Food_fid)
    REFERENCES Food (fid);

-- End of file.

