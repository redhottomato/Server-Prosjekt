import { DataTypes } from "sequelize";
import sequelize from "../db/sequelize.js";

const Participant = sequelize.define(
    "Participant",
    {
        id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },

        email: { type: DataTypes.STRING, allowNull: false, unique: true },
        firstName: { type: DataTypes.STRING, allowNull: false },
        lastName: { type: DataTypes.STRING, allowNull: false },

        // yyyy-mm-dd (DATEONLY)
        dob: { type: DataTypes.DATEONLY, allowNull: false },
    },
    {
        tableName: "participants",
        timestamps: true,
    }
);

export default Participant;
