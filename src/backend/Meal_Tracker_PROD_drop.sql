-- Created by Redgate Data Modeler (https://datamodeler.redgate-platform.com)
-- Last modification date: 2026-03-02 21:29:10.798

-- foreign keys
ALTER TABLE Admin
    DROP FOREIGN KEY Admin_User;

ALTER TABLE Recipe
    DROP FOREIGN KEY Recipe_User;

ALTER TABLE Workout
    DROP FOREIGN KEY Workout_User;

ALTER TABLE portion
    DROP FOREIGN KEY portion_Recipe;

ALTER TABLE portion
    DROP FOREIGN KEY rec_food_Food;

-- tables
DROP TABLE Admin;

DROP TABLE Food;

DROP TABLE Recipe;

DROP TABLE User;

DROP TABLE Workout;

DROP TABLE portion;

-- End of file.

