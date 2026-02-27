-- Created by Redgate Data Modeler (https://datamodeler.redgate-platform.com)
-- Last modification date: 2026-02-27 14:16:03.195

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
    pass varchar(50)  NOT NULL,
    cal_goal int  NOT NULL,
    wieght float  NOT NULL,
    wunit int  NOT NULL,
    Recipe_rid int  NULL,
    account_type int  NOT NULL,
    workout_wid int  NULL,
    CONSTRAINT User_pk PRIMARY KEY (uid)
);

-- Table: Workout
CREATE TABLE Workout (
    wid int  NOT NULL AUTO_INCREMENT,
    instructions text  NOT NULL,
    cal int  NOT NULL,
    User_uid int  NOT NULL,
    isPublic bool  NOT NULL,
    CONSTRAINT Workout_pk PRIMARY KEY (wid)
);

-- Table: portion
CREATE TABLE portion (
    Food_fid int  NOT NULL,
    Recipe_rid int  NOT NULL,
    qty float(100,100)  NOT NULL,
    CONSTRAINT portion_pk PRIMARY KEY (Food_fid,Recipe_rid)
) COMMENT 'Recipe Food Bridge Entity';

-- foreign keys
-- Reference: Admin_User (table: User)
ALTER TABLE User ADD CONSTRAINT Admin_User FOREIGN KEY Admin_User (uid)
    REFERENCES Admin (aid);

-- Reference: Recipe_User (table: Recipe)
ALTER TABLE Recipe ADD CONSTRAINT Recipe_User FOREIGN KEY Recipe_User (User_uid)
    REFERENCES User (uid);

-- Reference: Workout_User (table: Workout)
ALTER TABLE Workout ADD CONSTRAINT Workout_User FOREIGN KEY Workout_User (User_uid)
    REFERENCES User (uid);

-- Reference: portion_Recipe (table: portion)
ALTER TABLE portion ADD CONSTRAINT portion_Recipe FOREIGN KEY portion_Recipe (Recipe_rid)
    REFERENCES Recipe (rid);

-- Reference: rec_food_Food (table: portion)
ALTER TABLE portion ADD CONSTRAINT rec_food_Food FOREIGN KEY rec_food_Food (Food_fid)
    REFERENCES Food (fid);

-- End of file.

