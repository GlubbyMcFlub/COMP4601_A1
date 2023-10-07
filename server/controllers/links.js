import express from "express";
import mongoose from "mongoose";

import LinkModel from "../models/linkModel.js";


// i don't know if we need to get page data by id or link so ive written both
export const getLinks = async (req, res) => {
  try {
    const { link, id } = req.query;

    let links;

    if(id){
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ message: "Invalid link ID" });
      }
      const link = await LinkModel.findById(id).populate("incomingLinks");

      res.status(200).json(link);
      return;
    }
    else if(link){
      const regexPattern = new RegExp(link, "s"); // Define a regex pattern for case-sensitive search
      link = await LinkModel.find({
      link: { $regex: regexPattern },
      })
      .populate("incomingLinks");
      res.status(200).json(link);
    }
    else{
      links = await LinkModel.find()
      .populate("incomingLinks");
    }
    
    res.status(200).json(links);
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
};

export const getPopular = async (req, res) => {
  try {
    let links;

    links = await LinkModel.find().sort({numIncomingLinks: -1}).limit(10).populate("incomingLinks");
    //leave the receiving of page information to the client since it says that that is ok in the requirements
    res.status(200).json(links);
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
};

export const createLink = async (req, res) => {
  const link = req.body;
  const newLink = new LinkModel(link);

  try {
    await newLink.save();
    res.status(201).json(newLink);
  } catch (error) {
    res.status(409).json({ message: error.message });
  }
};