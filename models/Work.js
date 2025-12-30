import { DataTypes } from "sequelize";
import sequelize from "../db/sequelize.js";

const Work = sequelize.define(
    "Work",
    {
        id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },

        participantEmail: { type: DataTypes.STRING, allowNull: false, unique: true },

        companyname: { type: DataTypes.STRING, allowNull: false },
        salary: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
        currency: { type: DataTypes.STRING, allowNull: false },

        isDeleted: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    },
    {
        tableName: "work",
        timestamps: true,
    }
);

export default Work;
