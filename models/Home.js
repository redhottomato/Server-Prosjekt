import { DataTypes } from "sequelize";
import sequelize from "../db/sequelize.js";

const Home = sequelize.define(
    "Home",
    {
        id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },

        participantEmail: { type: DataTypes.STRING, allowNull: false, unique: true },

        country: { type: DataTypes.STRING, allowNull: false },
        city: { type: DataTypes.STRING, allowNull: false },

        isDeleted: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    },
    {
        tableName: "home",
        timestamps: true,
    }
);

export default Home;
