/* eslint-disable */
import { useState, useEffect, useRef, useCallback } from "react";
import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";

// ─── SUPABASE CONFIG ──────────────────────────────────────────────────────────
const SUPABASE_URL = "https://mxlpyaebssriqdubjeiu.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im14bHB5YWVic3NyaXFkdWJqZWl1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQzOTg5NTQsImV4cCI6MjA4OTk3NDk1NH0.BPz_CWlbEyIQIx63TwPcPYDJcCXteydA3wkTFIlQqYo";
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ─── ROBERTS READING PLAN (all 365 days) ─────────────────────────────────────
// Format: [month][day] = [reading1, reading2, reading3]
// Passages use short book names matching the KJV HTML anchors
const READING_PLAN = {
  // JANUARY
  "1-1": ["Genesis 1-2","Psalms 1-2","Matthew 1-2"],
  "1-2": ["Genesis 3-4","Psalms 3-5","Matthew 3-4"],
  "1-3": ["Genesis 5-6","Psalms 6-8","Matthew 5"],
  "1-4": ["Genesis 7-8","Psalms 9-10","Matthew 6"],
  "1-5": ["Genesis 9-10","Psalms 11-13","Matthew 7"],
  "1-6": ["Genesis 11-12","Psalms 14-16","Matthew 8"],
  "1-7": ["Genesis 13-14","Psalms 17","Matthew 9"],
  "1-8": ["Genesis 15-16","Psalms 18","Matthew 10"],
  "1-9": ["Genesis 17-18","Psalms 19-21","Matthew 11"],
  "1-10": ["Genesis 19","Psalms 22","Matthew 12"],
  "1-11": ["Genesis 20-21","Psalms 23-25","Matthew 13"],
  "1-12": ["Genesis 22-23","Psalms 26-29","Matthew 14"],
  "1-13": ["Genesis 24","Psalms 30","Matthew 15"],
  "1-14": ["Genesis 25-26","Psalms 31","Matthew 16"],
  "1-15": ["Genesis 27","Psalms 32","Matthew 17"],
  "1-16": ["Genesis 28-29","Psalms 33","Matthew 18"],
  "1-17": ["Genesis 30","Psalms 34","Matthew 19"],
  "1-18": ["Genesis 31","Psalms 35","Matthew 20"],
  "1-19": ["Genesis 32-33","Psalms 36","Matthew 21"],
  "1-20": ["Genesis 34-35","Psalms 37","Matthew 22"],
  "1-21": ["Genesis 36","Psalms 38","Matthew 23"],
  "1-22": ["Genesis 37","Psalms 39-40","Matthew 24"],
  "1-23": ["Genesis 38","Psalms 41-43","Matthew 25"],
  "1-24": ["Genesis 39-40","Psalms 44","Matthew 26"],
  "1-25": ["Genesis 41","Psalms 45","Matthew 27"],
  "1-26": ["Genesis 42-43","Psalms 46-48","Matthew 28"],
  "1-27": ["Genesis 44-45","Psalms 49","Romans 1-2"],
  "1-28": ["Genesis 46-47","Psalms 50","Romans 3-4"],
  "1-29": ["Genesis 48-50","Psalms 51-52","Romans 5-6"],
  "1-30": ["Exodus 1-2","Psalms 53-55","Romans 7-8"],
  "1-31": ["Exodus 3-4","Psalms 56-57","Romans 9"],

  // FEBRUARY
  "2-1": ["Exodus 5-6","Psalms 58-59","Romans 10-11"],
  "2-2": ["Exodus 7-8","Psalms 60-61","Romans 12"],
  "2-3": ["Exodus 9","Psalms 62-63","Romans 13-14"],
  "2-4": ["Exodus 10","Psalms 64-65","Romans 15-16"],
  "2-5": ["Exodus 11-12","Psalms 66-67","Mark 1"],
  "2-6": ["Exodus 13-14","Psalms 68","Mark 2"],
  "2-7": ["Exodus 15","Psalms 69","Mark 3"],
  "2-8": ["Exodus 16","Psalms 70-71","Mark 4"],
  "2-9": ["Exodus 17-18","Psalms 72","Mark 5"],
  "2-10": ["Exodus 19-20","Psalms 73","Mark 6"],
  "2-11": ["Exodus 21","Psalms 74","Mark 7"],
  "2-12": ["Exodus 22","Psalms 75-76","Mark 8"],
  "2-13": ["Exodus 23","Psalms 77","Mark 9"],
  "2-14": ["Exodus 24-25","Psalms 78","Mark 10"],
  "2-15": ["Exodus 26","Psalms 79-80","Mark 11"],
  "2-16": ["Exodus 27","Psalms 81-82","Mark 12"],
  "2-17": ["Exodus 28","Psalms 83-84","Mark 13"],
  "2-18": ["Exodus 29","Psalms 85-86","Mark 14"],
  "2-19": ["Exodus 30","Psalms 87-88","Mark 15-16"],
  "2-20": ["Exodus 31-32","Psalms 89","1 Corinthians 1-2"],
  "2-21": ["Exodus 33-34","Psalms 90-91","1 Corinthians 3"],
  "2-22": ["Exodus 35","Psalms 92-93","1 Corinthians 4-5"],
  "2-23": ["Exodus 36","Psalms 94-95","1 Corinthians 6"],
  "2-24": ["Exodus 37","Psalms 96-99","1 Corinthians 7"],
  "2-25": ["Exodus 38","Psalms 100-101","1 Corinthians 8-9"],
  "2-26": ["Exodus 39-40","Psalms 102","1 Corinthians 10"],
  "2-27": ["Leviticus 1-2","Psalms 103","1 Corinthians 11"],
  "2-28": ["Leviticus 3-4","Psalms 104","1 Corinthians 12-13"],
  "2-29": ["Leviticus 3-4","Psalms 104","1 Corinthians 12-13"],

  // MARCH
  "3-1": ["Leviticus 5-6","Psalms 105","1 Corinthians 14"],
  "3-2": ["Leviticus 7","Psalms 106","1 Corinthians 15"],
  "3-3": ["Leviticus 8","Psalms 107","1 Corinthians 16"],
  "3-4": ["Leviticus 9-10","Psalms 108-109","2 Corinthians 1-2"],
  "3-5": ["Leviticus 11","Psalms 110-112","2 Corinthians 3-4"],
  "3-6": ["Leviticus 12-13","Psalms 113-114","2 Corinthians 5-7"],
  "3-7": ["Leviticus 14","Psalms 115-116","2 Corinthians 8-9"],
  "3-8": ["Leviticus 15","Psalms 117-118","2 Corinthians 10-11"],
  "3-9": ["Leviticus 16","Psalms 119:1-40","2 Corinthians 12-13"],
  "3-10": ["Leviticus 17-18","Psalms 119:41-80","Luke 1"],
  "3-11": ["Leviticus 19","Psalms 119:81-128","Luke 2"],
  "3-12": ["Leviticus 20","Psalms 119:129-176","Luke 3"],
  "3-13": ["Leviticus 21","Psalms 120-124","Luke 4"],
  "3-14": ["Leviticus 22","Psalms 125-127","Luke 5"],
  "3-15": ["Leviticus 23","Psalms 128-130","Luke 6"],
  "3-16": ["Leviticus 24","Psalms 131-134","Luke 7"],
  "3-17": ["Leviticus 25","Psalms 135-136","Luke 8"],
  "3-18": ["Leviticus 26","Psalms 137-139","Luke 9"],
  "3-19": ["Leviticus 27","Psalms 140-142","Luke 10"],
  "3-20": ["Numbers 1","Psalms 143-144","Luke 11"],
  "3-21": ["Numbers 2","Psalms 145-147","Luke 12"],
  "3-22": ["Numbers 3","Psalms 148-150","Luke 13-14"],
  "3-23": ["Numbers 4","Proverbs 1","Luke 15"],
  "3-24": ["Numbers 5","Proverbs 2","Luke 16"],
  "3-25": ["Numbers 6","Proverbs 3","Luke 17"],
  "3-26": ["Numbers 7","Proverbs 4","Luke 18"],
  "3-27": ["Numbers 8-9","Proverbs 5","Luke 19"],
  "3-28": ["Numbers 10","Proverbs 6","Luke 20"],
  "3-29": ["Numbers 11","Proverbs 7","Luke 21"],
  "3-30": ["Numbers 12-13","Proverbs 8-9","Luke 22"],
  "3-31": ["Numbers 14","Proverbs 10","Luke 23"],

  // APRIL
  "4-1": ["Numbers 15","Proverbs 11","Luke 24"],
  "4-2": ["Numbers 16","Proverbs 12","Galatians 1-2"],
  "4-3": ["Numbers 17-18","Proverbs 13","Galatians 3-4"],
  "4-4": ["Numbers 19","Proverbs 14","Galatians 5-6"],
  "4-5": ["Numbers 20-21","Proverbs 15","Ephesians 1-2"],
  "4-6": ["Numbers 22-23","Proverbs 16","Ephesians 3-4"],
  "4-7": ["Numbers 24-25","Proverbs 17","Ephesians 5-6"],
  "4-8": ["Numbers 26","Proverbs 18","Philippians 1-2"],
  "4-9": ["Numbers 27","Proverbs 19","Philippians 3-4"],
  "4-10": ["Numbers 28","Proverbs 20","John 1"],
  "4-11": ["Numbers 29-30","Proverbs 21","John 2-3"],
  "4-12": ["Numbers 31","Proverbs 22","John 4"],
  "4-13": ["Numbers 32","Proverbs 23","John 5"],
  "4-14": ["Numbers 33","Proverbs 24","John 6"],
  "4-15": ["Numbers 34","Proverbs 25","John 7"],
  "4-16": ["Numbers 35","Proverbs 26","John 8"],
  "4-17": ["Numbers 36","Proverbs 27","John 9-10"],
  "4-18": ["Deuteronomy 1","Proverbs 28","John 11"],
  "4-19": ["Deuteronomy 2","Proverbs 29","John 12"],
  "4-20": ["Deuteronomy 3","Proverbs 30","John 13-14"],
  "4-21": ["Deuteronomy 4","Proverbs 31","John 15-16"],
  "4-22": ["Deuteronomy 5","Ecclesiastes 1","John 17-18"],
  "4-23": ["Deuteronomy 6-7","Ecclesiastes 2","John 19"],
  "4-24": ["Deuteronomy 8-9","Ecclesiastes 3","John 20-21"],
  "4-25": ["Deuteronomy 10-11","Ecclesiastes 4","Acts 1"],
  "4-26": ["Deuteronomy 12-13","Ecclesiastes 5","Acts 2"],
  "4-27": ["Deuteronomy 13-14","Ecclesiastes 6","Acts 3-4"],
  "4-28": ["Deuteronomy 15","Ecclesiastes 7","Acts 5-6"],
  "4-29": ["Deuteronomy 16","Ecclesiastes 8","Acts 7"],
  "4-30": ["Deuteronomy 17","Ecclesiastes 9","Acts 8"],

  // MAY
  "5-1": ["Deuteronomy 18","Ecclesiastes 10","Acts 9"],
  "5-2": ["Deuteronomy 19","Ecclesiastes 11","Acts 10"],
  "5-3": ["Deuteronomy 20","Ecclesiastes 12","Acts 11-12"],
  "5-4": ["Deuteronomy 21","Song of Solomon 1","Acts 13"],
  "5-5": ["Deuteronomy 22","Song of Solomon 2","Acts 14-15"],
  "5-6": ["Deuteronomy 23","Song of Solomon 3","Acts 16-17"],
  "5-7": ["Deuteronomy 24","Song of Solomon 4","Acts 18-19"],
  "5-8": ["Deuteronomy 25","Song of Solomon 5","Acts 20"],
  "5-9": ["Deuteronomy 26","Song of Solomon 6","Acts 21-22"],
  "5-10": ["Deuteronomy 27","Song of Solomon 7","Acts 23-24"],
  "5-11": ["Deuteronomy 28","Song of Solomon 8","Acts 25-26"],
  "5-12": ["Deuteronomy 29","Isaiah 1","Acts 27"],
  "5-13": ["Deuteronomy 30","Isaiah 2","Acts 28"],
  "5-14": ["Deuteronomy 31","Isaiah 3-4","Colossians 1"],
  "5-15": ["Deuteronomy 32","Isaiah 5","Colossians 2"],
  "5-16": ["Deuteronomy 33-34","Isaiah 6","Colossians 3-4"],
  "5-17": ["Joshua 1","Isaiah 7","1 Thessalonians 1-2"],
  "5-18": ["Joshua 2","Isaiah 8","1 Thessalonians 3-4"],
  "5-19": ["Joshua 3-4","Isaiah 9","1 Thessalonians 5"],
  "5-20": ["Joshua 5-6","Isaiah 10","2 Thessalonians 1-2"],
  "5-21": ["Joshua 7","Isaiah 11","2 Thessalonians 3"],
  "5-22": ["Joshua 8","Isaiah 12","1 Timothy 1-3"],
  "5-23": ["Joshua 9","Isaiah 13","1 Timothy 4-5"],
  "5-24": ["Joshua 10","Isaiah 14","1 Timothy 6"],
  "5-25": ["Joshua 11","Isaiah 15","2 Timothy 1"],
  "5-26": ["Joshua 12","Isaiah 16","2 Timothy 2"],
  "5-27": ["Joshua 13","Isaiah 17-18","2 Timothy 3-4"],
  "5-28": ["Joshua 14","Isaiah 19","Titus 1-3"],
  "5-29": ["Joshua 15","Isaiah 20-21","Philemon"],
  "5-30": ["Joshua 16","Isaiah 22","Hebrews 1-2"],
  "5-31": ["Joshua 17","Isaiah 23","Hebrews 3-5"],

  // JUNE
  "6-1": ["Joshua 18","Isaiah 24","Hebrews 6-7"],
  "6-2": ["Joshua 19","Isaiah 25","Hebrews 8-9"],
  "6-3": ["Joshua 20-21","Isaiah 26-27","Hebrews 10"],
  "6-4": ["Joshua 22","Isaiah 28","Hebrews 11"],
  "6-5": ["Joshua 23-24","Isaiah 29","Hebrews 12"],
  "6-6": ["Judges 1","Isaiah 30","Hebrews 13"],
  "6-7": ["Judges 2-3","Isaiah 31","James 1"],
  "6-8": ["Judges 4-5","Isaiah 32","James 2"],
  "6-9": ["Judges 6","Isaiah 33","James 3-4"],
  "6-10": ["Judges 7-8","Isaiah 34","James 5"],
  "6-11": ["Judges 9","Isaiah 35","1 Peter 1"],
  "6-12": ["Judges 10-11","Isaiah 36","1 Peter 2"],
  "6-13": ["Judges 12-13","Isaiah 37","1 Peter 3-5"],
  "6-14": ["Judges 14-15","Isaiah 38","2 Peter 1-2"],
  "6-15": ["Judges 16","Isaiah 39","2 Peter 3"],
  "6-16": ["Judges 17-18","Isaiah 40","1 John 1-2"],
  "6-17": ["Judges 19","Isaiah 41","1 John 3-4"],
  "6-18": ["Judges 20","Isaiah 42","1 John 5"],
  "6-19": ["Judges 21","Isaiah 43","2 John, 3 John"],
  "6-20": ["Ruth 1-2","Isaiah 44","Jude"],
  "6-21": ["Ruth 3-4","Isaiah 45","Revelation 1-2"],
  "6-22": ["1 Samuel 1","Isaiah 46-47","Revelation 3-4"],
  "6-23": ["1 Samuel 2","Isaiah 48","Revelation 5-6"],
  "6-24": ["1 Samuel 3","Isaiah 49","Revelation 7-9"],
  "6-25": ["1 Samuel 4","Isaiah 50","Revelation 10-11"],
  "6-26": ["1 Samuel 5-6","Isaiah 51","Revelation 12-13"],
  "6-27": ["1 Samuel 7-8","Isaiah 52","Revelation 14"],
  "6-28": ["1 Samuel 9","Isaiah 53","Revelation 15-16"],
  "6-29": ["1 Samuel 10","Isaiah 54","Revelation 17-18"],
  "6-30": ["1 Samuel 11-12","Isaiah 55","Revelation 19-20"],

  // JULY
  "7-1": ["1 Samuel 13","Isaiah 56-57","Revelation 21-22"],
  "7-2": ["1 Samuel 14","Isaiah 58","Matthew 1-2"],
  "7-3": ["1 Samuel 15","Isaiah 59","Matthew 3-4"],
  "7-4": ["1 Samuel 16","Isaiah 60","Matthew 5"],
  "7-5": ["1 Samuel 17","Isaiah 61","Matthew 6"],
  "7-6": ["1 Samuel 18","Isaiah 62","Matthew 7"],
  "7-7": ["1 Samuel 19","Isaiah 63","Matthew 8"],
  "7-8": ["1 Samuel 20","Isaiah 64","Matthew 9"],
  "7-9": ["1 Samuel 21-22","Isaiah 65","Matthew 10"],
  "7-10": ["1 Samuel 23","Isaiah 66","Matthew 11"],
  "7-11": ["1 Samuel 24","Jeremiah 1","Matthew 12"],
  "7-12": ["1 Samuel 25","Jeremiah 2","Matthew 13"],
  "7-13": ["1 Samuel 26-27","Jeremiah 3","Matthew 14"],
  "7-14": ["1 Samuel 28","Jeremiah 4","Matthew 15"],
  "7-15": ["1 Samuel 29-30","Jeremiah 5","Matthew 16"],
  "7-16": ["1 Samuel 31","Jeremiah 6","Matthew 17"],
  "7-17": ["2 Samuel 1","Jeremiah 7","Matthew 18"],
  "7-18": ["2 Samuel 2","Jeremiah 8","Matthew 19"],
  "7-19": ["2 Samuel 3","Jeremiah 9","Matthew 20"],
  "7-20": ["2 Samuel 4-5","Jeremiah 10","Matthew 21"],
  "7-21": ["2 Samuel 6","Jeremiah 11","Matthew 22"],
  "7-22": ["2 Samuel 7","Jeremiah 12","Matthew 23"],
  "7-23": ["2 Samuel 8-9","Jeremiah 13","Matthew 24"],
  "7-24": ["2 Samuel 10","Jeremiah 14","Matthew 25"],
  "7-25": ["2 Samuel 11","Jeremiah 15","Matthew 26"],
  "7-26": ["2 Samuel 12","Jeremiah 16","Matthew 27"],
  "7-27": ["2 Samuel 13","Jeremiah 17","Matthew 28"],
  "7-28": ["2 Samuel 14","Jeremiah 18","Romans 1-2"],
  "7-29": ["2 Samuel 15","Jeremiah 19","Romans 3-4"],
  "7-30": ["2 Samuel 16","Jeremiah 20","Romans 5-6"],
  "7-31": ["2 Samuel 17","Jeremiah 21","Romans 7-8"],

  // AUGUST
  "8-1": ["2 Samuel 18","Jeremiah 22","Romans 9"],
  "8-2": ["2 Samuel 19","Jeremiah 23","Romans 10-11"],
  "8-3": ["2 Samuel 20-21","Jeremiah 24","Romans 12"],
  "8-4": ["2 Samuel 22","Jeremiah 25","Romans 13-14"],
  "8-5": ["2 Samuel 23","Jeremiah 26","Romans 15-16"],
  "8-6": ["2 Samuel 24","Jeremiah 27","Mark 1"],
  "8-7": ["1 Kings 1","Jeremiah 28","Mark 2"],
  "8-8": ["1 Kings 2","Jeremiah 29","Mark 3"],
  "8-9": ["1 Kings 3","Jeremiah 30","Mark 4"],
  "8-10": ["1 Kings 4-5","Jeremiah 31","Mark 5"],
  "8-11": ["1 Kings 6","Jeremiah 32","Mark 6"],
  "8-12": ["1 Kings 7","Jeremiah 33","Mark 7"],
  "8-13": ["1 Kings 8","Jeremiah 34","Mark 8"],
  "8-14": ["1 Kings 9","Jeremiah 35","Mark 9"],
  "8-15": ["1 Kings 10","Jeremiah 36","Mark 10"],
  "8-16": ["1 Kings 11","Jeremiah 37","Mark 11"],
  "8-17": ["1 Kings 12","Jeremiah 38","Mark 12"],
  "8-18": ["1 Kings 13","Jeremiah 39","Mark 13"],
  "8-19": ["1 Kings 14","Jeremiah 40","Mark 14"],
  "8-20": ["1 Kings 15","Jeremiah 41","Mark 15"],
  "8-21": ["1 Kings 16","Jeremiah 42","Mark 16"],
  "8-22": ["1 Kings 17","Jeremiah 43","1 Corinthians 1-2"],
  "8-23": ["1 Kings 18","Jeremiah 44","1 Corinthians 3"],
  "8-24": ["1 Kings 19","Jeremiah 45-46","1 Corinthians 4-5"],
  "8-25": ["1 Kings 20","Jeremiah 47","1 Corinthians 6"],
  "8-26": ["1 Kings 21","Jeremiah 48","1 Corinthians 7"],
  "8-27": ["1 Kings 22","Jeremiah 49","1 Corinthians 8-9"],
  "8-28": ["2 Kings 1-2","Jeremiah 50","1 Corinthians 10"],
  "8-29": ["2 Kings 3","Jeremiah 51","1 Corinthians 11"],
  "8-30": ["2 Kings 4","Jeremiah 52","1 Corinthians 12-13"],
  "8-31": ["2 Kings 5","Lamentations 1","1 Corinthians 14"],

  // SEPTEMBER
  "9-1": ["2 Kings 6","Lamentations 2","1 Corinthians 15"],
  "9-2": ["2 Kings 7","Lamentations 3","1 Corinthians 16"],
  "9-3": ["2 Kings 8","Lamentations 4","2 Corinthians 1-2"],
  "9-4": ["2 Kings 9","Lamentations 5","2 Corinthians 3-4"],
  "9-5": ["2 Kings 10","Ezekiel 1","2 Corinthians 5-7"],
  "9-6": ["2 Kings 11-12","Ezekiel 2","2 Corinthians 8-9"],
  "9-7": ["2 Kings 13","Ezekiel 3","2 Corinthians 10-11"],
  "9-8": ["2 Kings 14","Ezekiel 4","2 Corinthians 12-13"],
  "9-9": ["2 Kings 15","Ezekiel 5","Luke 1"],
  "9-10": ["2 Kings 16","Ezekiel 6","Luke 2"],
  "9-11": ["2 Kings 17","Ezekiel 7","Luke 3"],
  "9-12": ["2 Kings 18","Ezekiel 8","Luke 4"],
  "9-13": ["2 Kings 19","Ezekiel 9","Luke 5"],
  "9-14": ["2 Kings 20","Ezekiel 10","Luke 6"],
  "9-15": ["2 Kings 21","Ezekiel 11","Luke 7"],
  "9-16": ["2 Kings 22-23","Ezekiel 12","Luke 8"],
  "9-17": ["2 Kings 24-25","Ezekiel 13","Luke 9"],
  "9-18": ["1 Chronicles 1","Ezekiel 14","Luke 10"],
  "9-19": ["1 Chronicles 2","Ezekiel 15","Luke 11"],
  "9-20": ["1 Chronicles 3","Ezekiel 16","Luke 12"],
  "9-21": ["1 Chronicles 4","Ezekiel 17","Luke 13-14"],
  "9-22": ["1 Chronicles 5","Ezekiel 18","Luke 15"],
  "9-23": ["1 Chronicles 6","Ezekiel 19","Luke 16"],
  "9-24": ["1 Chronicles 7","Ezekiel 20","Luke 17"],
  "9-25": ["1 Chronicles 8","Ezekiel 21","Luke 18"],
  "9-26": ["1 Chronicles 9","Ezekiel 22","Luke 19"],
  "9-27": ["1 Chronicles 10","Ezekiel 23","Luke 20"],
  "9-28": ["1 Chronicles 11","Ezekiel 24","Luke 21"],
  "9-29": ["1 Chronicles 12","Ezekiel 25","Luke 22"],
  "9-30": ["1 Chronicles 13-14","Ezekiel 26","Luke 23"],

  // OCTOBER
  "10-1": ["1 Chronicles 15","Ezekiel 27","Luke 24"],
  "10-2": ["1 Chronicles 16","Ezekiel 28","Galatians 1-2"],
  "10-3": ["1 Chronicles 17","Ezekiel 29","Galatians 3-4"],
  "10-4": ["1 Chronicles 18-19","Ezekiel 30","Galatians 5-6"],
  "10-5": ["1 Chronicles 20-21","Ezekiel 31","Ephesians 1-2"],
  "10-6": ["1 Chronicles 22","Ezekiel 32","Ephesians 3-4"],
  "10-7": ["1 Chronicles 23","Ezekiel 33","Ephesians 5-6"],
  "10-8": ["1 Chronicles 24-25","Ezekiel 34","Philippians 1-2"],
  "10-9": ["1 Chronicles 26","Ezekiel 35","Philippians 3-4"],
  "10-10": ["1 Chronicles 27","Ezekiel 36","John 1"],
  "10-11": ["1 Chronicles 28","Ezekiel 37","John 2-3"],
  "10-12": ["1 Chronicles 29","Ezekiel 38","John 4"],
  "10-13": ["2 Chronicles 1-2","Ezekiel 39","John 5"],
  "10-14": ["2 Chronicles 3-4","Ezekiel 40","John 6"],
  "10-15": ["2 Chronicles 5-6","Ezekiel 41","John 7"],
  "10-16": ["2 Chronicles 7","Ezekiel 42","John 8"],
  "10-17": ["2 Chronicles 8","Ezekiel 43","John 9-10"],
  "10-18": ["2 Chronicles 9","Ezekiel 44","John 11"],
  "10-19": ["2 Chronicles 10-11","Ezekiel 45","John 12"],
  "10-20": ["2 Chronicles 12-13","Ezekiel 46","John 13-14"],
  "10-21": ["2 Chronicles 14-15","Ezekiel 47","John 15-16"],
  "10-22": ["2 Chronicles 16-17","Ezekiel 48","John 17-18"],
  "10-23": ["2 Chronicles 18-19","Daniel 1","John 19"],
  "10-24": ["2 Chronicles 20","Daniel 2","John 20-21"],
  "10-25": ["2 Chronicles 21-22","Daniel 3","Acts 1"],
  "10-26": ["2 Chronicles 23","Daniel 4","Acts 2"],
  "10-27": ["2 Chronicles 24","Daniel 5","Acts 3-4"],
  "10-28": ["2 Chronicles 25","Daniel 6","Acts 5-6"],
  "10-29": ["2 Chronicles 26-27","Daniel 7","Acts 7"],
  "10-30": ["2 Chronicles 28","Daniel 8","Acts 8"],
  "10-31": ["2 Chronicles 29","Daniel 9","Acts 9"],

  // NOVEMBER
  "11-1": ["2 Chronicles 30","Daniel 10","Acts 10"],
  "11-2": ["2 Chronicles 31","Daniel 11","Acts 11-12"],
  "11-3": ["2 Chronicles 32","Daniel 12","Acts 13"],
  "11-4": ["2 Chronicles 33","Hosea 1","Acts 14-15"],
  "11-5": ["2 Chronicles 34","Hosea 2","Acts 16-17"],
  "11-6": ["2 Chronicles 35","Hosea 3","Acts 18-19"],
  "11-7": ["2 Chronicles 36","Hosea 4","Acts 20"],
  "11-8": ["Ezra 1-2","Hosea 5","Acts 21-22"],
  "11-9": ["Ezra 3-4","Hosea 6","Acts 23-24"],
  "11-10": ["Ezra 5-6","Hosea 7","Acts 25-26"],
  "11-11": ["Ezra 7","Hosea 8","Acts 27"],
  "11-12": ["Ezra 8","Hosea 9","Acts 28"],
  "11-13": ["Ezra 9","Hosea 10","Colossians 1"],
  "11-14": ["Ezra 10","Hosea 11","Colossians 2"],
  "11-15": ["Nehemiah 1-2","Hosea 12","Colossians 3-4"],
  "11-16": ["Nehemiah 3","Hosea 13","1 Thessalonians 1-2"],
  "11-17": ["Nehemiah 4","Hosea 14","1 Thessalonians 3-4"],
  "11-18": ["Nehemiah 5-6","Joel 1","1 Thessalonians 5"],
  "11-19": ["Nehemiah 7","Joel 2","2 Thessalonians 1-2"],
  "11-20": ["Nehemiah 8","Joel 3","2 Thessalonians 3"],
  "11-21": ["Nehemiah 9","Amos 1","1 Timothy 1-3"],
  "11-22": ["Nehemiah 10","Amos 2","1 Timothy 4-5"],
  "11-23": ["Nehemiah 11","Amos 3","1 Timothy 6"],
  "11-24": ["Nehemiah 12","Amos 4","2 Timothy 1"],
  "11-25": ["Nehemiah 13","Amos 5","2 Timothy 2"],
  "11-26": ["Esther 1","Amos 6","2 Timothy 3-4"],
  "11-27": ["Esther 2","Amos 7","Titus 1-3"],
  "11-28": ["Esther 3-4","Amos 8","Philemon"],
  "11-29": ["Esther 5-6","Amos 9","Hebrews 1-2"],
  "11-30": ["Esther 7-8","Obadiah","Hebrews 3-5"],

  // DECEMBER
  "12-1": ["Esther 9-10","Jonah 1","Hebrews 6-7"],
  "12-2": ["Job 1-2","Jonah 2-3","Hebrews 8-9"],
  "12-3": ["Job 3-4","Jonah 4","Hebrews 10"],
  "12-4": ["Job 5","Micah 1","Hebrews 11"],
  "12-5": ["Job 6-7","Micah 2","Hebrews 12"],
  "12-6": ["Job 8","Micah 3-4","Hebrews 13"],
  "12-7": ["Job 9","Micah 5","James 1"],
  "12-8": ["Job 10","Micah 6","James 2"],
  "12-9": ["Job 11","Micah 7","James 3-4"],
  "12-10": ["Job 12","Nahum 1-2","James 5"],
  "12-11": ["Job 13","Nahum 3","1 Peter 1"],
  "12-12": ["Job 14","Habakkuk 1","1 Peter 2"],
  "12-13": ["Job 15","Habakkuk 2","1 Peter 3-5"],
  "12-14": ["Job 16-17","Habakkuk 3","2 Peter 1-2"],
  "12-15": ["Job 18-19","Zephaniah 1","2 Peter 3"],
  "12-16": ["Job 20","Zephaniah 2","1 John 1-2"],
  "12-17": ["Job 21","Zephaniah 3","1 John 3-4"],
  "12-18": ["Job 22","Haggai 1","1 John 5"],
  "12-19": ["Job 23-24","Zechariah 1","2 John, 3 John"],
  "12-20": ["Job 25-27","Zechariah 2-3","Jude"],
  "12-21": ["Job 28","Zechariah 4-5","Revelation 1-2"],
  "12-22": ["Job 29-30","Zechariah 6-7","Revelation 3-4"],
  "12-23": ["Job 31-32","Zechariah 8","Revelation 5-6"],
  "12-24": ["Job 33","Zechariah 9","Revelation 7-9"],
  "12-25": ["Job 34","Zechariah 10","Revelation 10-11"],
  "12-26": ["Job 35-36","Zechariah 11","Revelation 12-13"],
  "12-27": ["Job 37","Zechariah 12","Revelation 14"],
  "12-28": ["Job 38","Zechariah 13","Revelation 15-16"],
  "12-29": ["Job 39","Malachi 1","Revelation 17-18"],
  "12-30": ["Job 40","Malachi 2","Revelation 19-20"],
  "12-31": ["Job 41-42","Malachi 3-4","Revelation 21-22"],
};

const MONTH_NAMES = ["January","February","March","April","May","June","July","August","September","October","November","December"];

// ─── BIBLE BROWSER DATA ───────────────────────────────────────────────────────
const BIBLE_BOOKS = [
  "Genesis","Exodus","Leviticus","Numbers","Deuteronomy","Joshua","Judges","Ruth",
  "1 Samuel","2 Samuel","1 Kings","2 Kings","1 Chronicles","2 Chronicles","Ezra",
  "Nehemiah","Esther","Job","Psalms","Proverbs","Ecclesiastes","Song of Solomon",
  "Isaiah","Jeremiah","Lamentations","Ezekiel","Daniel","Hosea","Joel","Amos",
  "Obadiah","Jonah","Micah","Nahum","Habakkuk","Zephaniah","Haggai","Zechariah",
  "Malachi","Matthew","Mark","Luke","John","Acts","Romans","1 Corinthians",
  "2 Corinthians","Galatians","Ephesians","Philippians","Colossians",
  "1 Thessalonians","2 Thessalonians","1 Timothy","2 Timothy","Titus","Philemon",
  "Hebrews","James","1 Peter","2 Peter","1 John","2 John","3 John","Jude","Revelation"
];
const CHAPTER_COUNTS = {
  "Genesis":50,"Exodus":40,"Leviticus":27,"Numbers":36,"Deuteronomy":34,"Joshua":24,
  "Judges":21,"Ruth":4,"1 Samuel":31,"2 Samuel":24,"1 Kings":22,"2 Kings":25,
  "1 Chronicles":29,"2 Chronicles":36,"Ezra":10,"Nehemiah":13,"Esther":10,"Job":42,
  "Psalms":150,"Proverbs":31,"Ecclesiastes":12,"Song of Solomon":8,"Isaiah":66,
  "Jeremiah":52,"Lamentations":5,"Ezekiel":48,"Daniel":12,"Hosea":14,"Joel":3,
  "Amos":9,"Obadiah":1,"Jonah":4,"Micah":7,"Nahum":3,"Habakkuk":3,"Zephaniah":3,
  "Haggai":2,"Zechariah":14,"Malachi":4,"Matthew":28,"Mark":16,"Luke":24,"John":21,
  "Acts":28,"Romans":16,"1 Corinthians":16,"2 Corinthians":13,"Galatians":6,
  "Ephesians":6,"Philippians":4,"Colossians":4,"1 Thessalonians":5,"2 Thessalonians":3,
  "1 Timothy":6,"2 Timothy":4,"Titus":3,"Philemon":1,"Hebrews":13,"James":5,
  "1 Peter":5,"2 Peter":3,"1 John":5,"2 John":1,"3 John":1,"Jude":1,"Revelation":22
};

// ─── CONSTANTS ───────────────────────────────────────────────────────────────
const HIGHLIGHT_COLOURS = [
  { name:"Yellow",      bg:"#fff176", border:"#f9a825", text:"#000" },
  { name:"Lime",        bg:"#ccff90", border:"#558b2f", text:"#000" },
  { name:"Mint",        bg:"#b2dfdb", border:"#00695c", text:"#000" },
  { name:"Sky",         bg:"#b3e5fc", border:"#0277bd", text:"#000" },
  { name:"Lavender",    bg:"#e1bee7", border:"#6a1b9a", text:"#000" },
  { name:"Pink",        bg:"#f8bbd0", border:"#ad1457", text:"#000" },
  { name:"Peach",       bg:"#ffe0b2", border:"#e65100", text:"#000" },
  { name:"Rose",        bg:"#ffcdd2", border:"#b71c1c", text:"#000" },
  { name:"Tan",         bg:"#d7ccc8", border:"#4e342e", text:"#000" },
  { name:"Silver",      bg:"#cfd8dc", border:"#37474f", text:"#000" },
  { name:"Gold",        bg:"#ffe082", border:"#ff6f00", text:"#000" },
  { name:"Sage",        bg:"#dcedc8", border:"#33691e", text:"#000" },
];

// ─── STYLES ───────────────────────────────────────────────────────────────────
const styles = `
  @import url('https://fonts.googleapis.com/css2?family=EB+Garamond:ital,wght@0,400;0,500;0,600;1,400&family=Lato:wght@300;400;700&family=Merriweather:ital,wght@0,300;0,400;0,700;1,300;1,400&display=swap');

  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: #F1E9DB; margin:0; padding:0; }

:root {
    --parchment: #F1E9DB;
    --parchment-dark: #E8DCC8;
    --ink: #221E1E;
    --ink-light: #5a5050;
    --gold: #297373;
    --gold-light: #3a9090;
    --red: #297373;
    --accent: #9BC53D;
    --border: #c9bfaa;
    --white: #faf6ef;
    --panel-h: 45vh;
  }
  .dark {
    --parchment: #221E1E;
    --parchment-dark: #1a1616;
    --ink: #F1E9DB;
    --ink-light: #a89880;
    --gold: #297373;
    --gold-light: #3a9090;
    --red: #3a9090;
    --accent: #9BC53D;
    --border: #3a3030;
    --white: #2e2828;
    --panel-h: 45vh;
  }
  .dark body { background: #221E1E; }
  .dark .sel-toolbar { background: #0f1923; border: 1px solid #2e3a50; }
  .dark .sel-comment-btn { color: #e8e0cc; border-color: #2e3a50; }
  .dark .colour-picker-overlay { background: rgba(0,0,0,0.75); }
  .dark .comment-card { background: #16213e; }
  .dark .passage-text { color: var(--ink); }
  .dark .auth-overlay { background: rgba(0,0,0,0.85); }
  .dark .header { background: var(--gold); color: var(--ink); }
  .dark .header button { color: var(--ink); }
  .dark .tabs { background: none; }
  .dark .tab { color: var(--gold); background: var(--parchment); }
  .dark .tab.active { color: var(--ink); background: var(--gold); }
  .dark .header-nav-btn { color: var(--ink); }
  .dark .header-date-display { color: var(--ink); }

  .app {
    font-family: 'Lato', sans-serif;
    background: var(--parchment);
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    color: var(--ink);
    max-width: 480px;
    margin: 0 auto;
    position: relative;
  }

  /* FIXED TOP HEADER — compact single bar */
  .header {
    background: var(--accent);
    color: var(--parchment);
    padding: 0 12px;
    height: 52px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-shrink: 0;
    border-bottom: none;
    position: fixed;
    top: 0; left: 50%; transform: translateX(-50%);
    width: 100%; max-width: 480px;
    z-index: 200;
  }
  .header-left { display:flex; flex-direction:column; justify-content:center; min-width:60px; }
  .header-title { font-family:'Lato',sans-serif; font-size:20px; font-weight:900; letter-spacing:0.3px; line-height:1.1; text-transform:uppercase; }
  .header-date { display:none; }
  .header-center { display:flex; align-items:center; gap:4px; }
  .header-nav-btn { background:none; border:none; color:var(--ink); font-size:20px; cursor:pointer; padding:4px 6px; line-height:1; transition:color 0.15s; }
  .header-nav-btn:hover { color:var(--gold); }
  .header-date-display { font-family:'Lato',sans-serif; font-size:16px; font-weight:700; color:var(--ink); min-width:70px; text-align:center; white-space:nowrap; }
  .header-right { display:flex; align-items:center; gap:5px; min-width:60px; justify-content:flex-end; }
  .header-icon-btn { background:none; border:none; color:var(--ink); cursor:pointer; padding:4px; font-size:15px; line-height:1; border-radius:4px; transition:all 0.15s; }
  .header-icon-btn:hover { color:var(--gold); }
  .font-size-btn { background:none; border:1px solid var(--gold); border-radius:5px; padding:3px 7px; font-size:12px; font-weight:700; cursor:pointer; color:var(--gold-light); font-family:'Lato',sans-serif; line-height:1; transition:all 0.15s; }
  .font-size-btn:hover { background:var(--gold); color:var(--ink); }
  .font-size-btn:disabled { opacity:0.3; cursor:not-allowed; }
  .header-btn { background:none; border:1px solid var(--ink); color:var(--ink); border-radius:5px; padding:4px 8px; font-family:'Lato',sans-serif; font-size:11px; cursor:pointer; transition:all 0.15s; white-space:nowrap; }
  .header-btn:hover { background:var(--gold); color:var(--white); }
  .today-chip { font-size:10px; font-family:'Lato',sans-serif; background:var(--gold); color:var(--white); border:none; border-radius:10px; padding:2px 7px; cursor:pointer; font-weight:700; }

  /* SPACER — pushes content below fixed header */
  .header-spacer { height: 52px; flex-shrink:0; }
/* BOTTOM TAB BAR — fixed at bottom */
  .tabs {
    display: flex;
    background: none;
    border-top: none;
    position: fixed;
    bottom: 0; left: 50%; transform: translateX(-50%);
    width: 100%; max-width: 480px;
    z-index: 200;
    padding-bottom: env(safe-area-inset-bottom, 0);
  }
  .tab {
    flex: 1; padding: 8px 2px 10px;
    font-size: 10px; font-family:'Lato',sans-serif; font-weight:700;
    text-align:center; cursor:pointer;
    color: var(--ink);
    background: var(--parchment);
    border: none;
    border-top: 3px solid transparent;
    transition: all 0.2s; white-space:nowrap;
  }
  .tab.active {
    color: var(--ink);
    background: var(--accent);
    border-top-color: transparent;
  }
  .tab-icon { display:block; font-size:18px; margin-bottom:1px; line-height:1; }
  .tab-label { display:block; font-size:9px; font-weight:700; letter-spacing:0.3px; }
  /* BOTTOM TAB SPACER */
  .tabs-spacer { height: calc(56px + env(safe-area-inset-bottom, 0px)); flex-shrink:0; }
  /* DATE BAR — removed, merged into header */
  .share-btn { background:none; border:1px solid var(--gold); color:var(--gold-light); border-radius:5px; padding:3px 7px; font-family:'Lato',sans-serif; font-size:11px; cursor:pointer; transition:all 0.15s; }
  .share-btn:hover { background:var(--gold); color:var(--ink); }

  /* PASSAGE SCROLL AREA */
  .passage-scroll {
    overflow-y: auto;
    height: calc(100vh - 52px - 56px - env(safe-area-inset-bottom, 0px));
    -webkit-overflow-scrolling: touch;
  }
  .passage-container { padding: 0 0 120px; position:relative; }
  .floating-title { position:sticky; top:0; z-index:20; text-align:center; padding:8px 16px 10px; pointer-events:none; background:var(--accent); }
  .dark .floating-title { background:var(--gold); }
  .floating-title-book { font-family:'Lato',sans-serif; font-size:18px; font-weight:900; color:var(--ink); text-transform:uppercase; letter-spacing:1.5px; }
  .floating-title-chapter { font-family:'Lato',sans-serif; font-size:18px; font-weight:900; color:var(--ink); letter-spacing:1.5px; margin-left:8px; }
  .dark .floating-title-book { color:var(--ink); }
  .dark .floating-title-chapter { color:var(--ink); }
  .passage-text { font-family:'Lato',sans-serif; font-size:var(--reading-size,18px); line-height:1.9; color:var(--ink); padding:4px 18px; }
  .verse { margin-bottom:5px; position:relative; cursor:default; border-radius:4px; padding:2px 4px; transition:background 0.15s; }
  .verse:hover { background: rgba(41,115,115,0.06); }
  .verse-num { font-size:0.75em; font-family:'Lato',sans-serif; font-weight:700; color:var(--gold); vertical-align:super; margin-right:3px; }
  .verse-footnote { font-size:0.7em; font-family:'Lato',sans-serif; font-weight:700; color:var(--red); vertical-align:super; margin-left:3px; cursor:pointer; line-height:0; }
  .verse-footnote:hover { text-decoration:underline; }
  .loading-text { font-family:'EB Garamond',serif; font-style:italic; color:var(--ink-light); font-size:16px; padding:40px 0; text-align:center; }

  /* HIGHLIGHT TOOLBAR — appears on text selection */
  .sel-toolbar {
    position: fixed;
    background: var(--ink);
    border-radius: 10px;
    padding: 8px 10px;
    display: flex;
    align-items: center;
    gap: 6px;
    z-index: 500;
    box-shadow: 0 4px 20px rgba(0,0,0,0.35);
    flex-wrap: wrap;
    max-width: 280px;
  }
  .sel-swatch {
    width: 22px; height: 22px;
    border-radius: 50%;
    cursor: pointer;
    border: 2px solid transparent;
    transition: transform 0.15s, border-color 0.15s;
    flex-shrink: 0;
  }
  .sel-swatch:hover { transform: scale(1.25); border-color: white; }
  .sel-swatch.underline {
    background: none !important;
    border: 2px solid white;
    display: flex; align-items: center; justify-content: center;
    font-size: 13px; color: white; font-weight: 700; font-family: serif;
  }
  .sel-custom {
    width: 22px; height: 22px; border-radius: 50%;
    cursor: pointer; border: 2px dashed #aaa;
    background: conic-gradient(red,yellow,lime,cyan,blue,magenta,red);
    flex-shrink: 0;
  }
  .sel-comment-btn {
    background: none; border: 1px solid #aaa; color: white;
    border-radius: 6px; padding: 3px 8px; font-size: 11px;
    font-family: 'Lato', sans-serif; cursor: pointer; white-space: nowrap;
  }
  .sel-comment-btn:hover { background: rgba(255,255,255,0.15); }
  .sel-divider { width:1px; height:20px; background:rgba(255,255,255,0.2); }

  /* ANNOTATED TEXT */
  .hl { border-radius: 2px; }
  .ul { border-bottom: 2px solid; text-decoration: none; }

  /* BOTTOM PANEL */
  .panel-backdrop {
    position: fixed;
    inset: 0;
    background: rgba(0,0,0,0.25);
    z-index: 90;
    transition: opacity 0.3s;
  }
  .bottom-panel {
    position: fixed;
    bottom: 0;
    left: 50%;
    transform: translateX(-50%);
    width: 100%;
    max-width: 480px;
    background: var(--white);
    border-radius: 16px 16px 0 0;
    border-top: 3px solid var(--gold);
    z-index: 100;
    display: flex;
    flex-direction: column;
    box-shadow: 0 -6px 30px rgba(0,0,0,0.2);
    transition: height 0.3s cubic-bezier(.4,0,.2,1);
    overflow: hidden;
  }
  .panel-drag-handle {
    width: 36px; height: 4px;
    background: var(--border);
    border-radius: 2px;
    margin: 10px auto 0;
    cursor: ns-resize;
    flex-shrink: 0;
  }
  .panel-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 8px 16px 6px;
    border-bottom: 1px solid var(--border);
    flex-shrink: 0;
  }
  .panel-title { font-family:'EB Garamond',serif; font-size:17px; font-weight:500; color:var(--ink); display:flex; align-items:center; gap:8px; }
  .panel-count { background:var(--parchment-dark); border-radius:10px; padding:1px 7px; font-family:'Lato',sans-serif; font-size:11px; color:var(--ink-light); }
  .panel-close { background:none; border:none; font-size:20px; cursor:pointer; color:var(--ink-light); line-height:1; padding:2px 6px; }
  .panel-close:hover { color:var(--red); }
  .panel-anchor-label {
    padding: 6px 16px;
    background: var(--parchment);
    border-bottom: 1px solid var(--border);
    font-family: 'EB Garamond', serif;
    font-style: italic;
    font-size: 13px;
    color: var(--ink-light);
    flex-shrink: 0;
  }
  .panel-scroll { flex:1; overflow-y:auto; padding:12px 16px; }

  /* COMMENT CARDS */
  .comment-card { background:var(--parchment); border:1px solid var(--border); border-radius:8px; padding:10px 12px; margin-bottom:8px; }
  .comment-header { display:flex; justify-content:space-between; margin-bottom:5px; }
  .comment-author { font-family:'Lato',sans-serif; font-size:11px; font-weight:700; color:var(--red); text-transform:uppercase; letter-spacing:0.5px; }
  .comment-time { font-family:'Lato',sans-serif; font-size:10px; color:var(--ink-light); }
  .comment-anchor { font-family:'EB Garamond',serif; font-style:italic; font-size:12px; color:var(--gold); margin-bottom:4px; }
  .comment-body { font-family:'EB Garamond',serif; font-size:15px; line-height:1.6; color:var(--ink); }
  .comment-form { margin-top:10px; }
  .comment-textarea { width:100%; border:1px solid var(--border); border-radius:6px; padding:9px; font-family:'EB Garamond',serif; font-size:15px; background:var(--white); color:var(--ink); resize:none; min-height:72px; outline:none; transition:border-color 0.2s; }
  .comment-textarea:focus { border-color:var(--gold); }
  .comment-submit { margin-top:8px; background:var(--red); color:var(--white); border:none; border-radius:6px; padding:9px 18px; font-family:'Lato',sans-serif; font-size:12px; font-weight:700; letter-spacing:0.5px; cursor:pointer; width:100%; transition:opacity 0.2s; }
  .comment-submit:hover { opacity:0.85; }
  .comment-submit:disabled { opacity:0.4; cursor:not-allowed; }
  .no-comments { font-family:'EB Garamond',serif; font-style:italic; color:var(--ink-light); font-size:14px; padding:8px 0 12px; }
  .sign-in-prompt { font-family:'EB Garamond',serif; font-style:italic; color:var(--ink-light); font-size:14px; text-align:center; padding:10px 0 4px; }
  .sign-in-prompt-btn { background:none; border:none; color:var(--gold); font-size:14px; font-family:'EB Garamond',serif; font-style:italic; cursor:pointer; text-decoration:underline; }

  /* AUTH */
  .auth-overlay { position:fixed; inset:0; background:rgba(26,18,9,0.85); z-index:200; display:flex; align-items:center; justify-content:center; padding:20px; }
  .auth-card { background:var(--white); border-radius:12px; padding:28px 24px; width:100%; max-width:380px; border-top:4px solid var(--gold); }
  .auth-title { font-family:'EB Garamond',serif; font-size:22px; font-weight:500; color:var(--ink); margin-bottom:4px; }
  .auth-subtitle { font-size:12px; color:var(--ink-light); margin-bottom:18px; }
  .auth-input { width:100%; border:1px solid var(--border); border-radius:6px; padding:10px 12px; font-family:'Lato',sans-serif; font-size:14px; background:var(--parchment); color:var(--ink); margin-bottom:10px; outline:none; transition:border-color 0.2s; }
  .auth-input:focus { border-color:var(--gold); }
  .auth-btn { width:100%; background:var(--ink); color:var(--parchment); border:none; border-radius:6px; padding:11px; font-family:'Lato',sans-serif; font-size:13px; font-weight:700; cursor:pointer; margin-bottom:8px; transition:opacity 0.2s; }
  .auth-btn:hover { opacity:0.85; }
  .auth-btn:disabled { opacity:0.4; }
  .auth-switch { text-align:center; font-size:12px; color:var(--ink-light); }
  .auth-switch-btn { background:none; border:none; color:var(--gold); font-size:12px; font-family:'Lato',sans-serif; cursor:pointer; text-decoration:underline; }
  .auth-error { background:#fdf0f0; border:1px solid #e0a0a0; border-radius:6px; padding:9px 11px; font-size:12px; color:var(--red); margin-bottom:10px; }
  .auth-close { float:right; background:none; border:none; font-size:20px; cursor:pointer; color:var(--ink-light); line-height:1; }

  /* TOAST */
  .toast { position:fixed; bottom:24px; left:50%; transform:translateX(-50%); background:var(--ink); color:var(--parchment); padding:9px 18px; border-radius:20px; font-family:'Lato',sans-serif; font-size:12px; z-index:300; animation:fadeInUp 0.3s ease; }
  @keyframes fadeInUp { from{opacity:0;transform:translateX(-50%) translateY(10px)} to{opacity:1;transform:translateX(-50%) translateY(0)} }

  .no-readings { font-family:'EB Garamond',serif; font-style:italic; color:var(--ink-light); text-align:center; padding:40px 0; font-size:16px; }

  /* COMMENT VISIBILITY TOGGLE */
  .comment-view-toggle { display:flex; gap:6px; padding:10px 16px 4px; flex-shrink:0; }
  .cv-btn { flex:1; padding:6px 8px; border-radius:20px; border:1px solid var(--border); background:none; font-family:'Lato',sans-serif; font-size:12px; font-weight:700; color:var(--ink-light); cursor:pointer; transition:all 0.2s; }
  .cv-btn.active { background:var(--red); color:white; border-color:var(--red); }
  .group-select { width:100%; margin:4px 16px 0; padding:5px 8px; border:1px solid var(--border); border-radius:8px; background:var(--parchment); color:var(--ink); font-family:'Lato',sans-serif; font-size:12px; outline:none; width:calc(100% - 32px); }

  /* WIDE SCREEN / LANDSCAPE LAYOUT */
  @media (min-width: 768px), (orientation: landscape) and (max-height: 500px) {
    .app { max-width: 100%; }
    .header { max-width: 100%; left: 0; transform: none; width: 100%; }
    .tabs { max-width: 100%; left: 0; transform: none; width: 100%; }
    .wide-wrapper { display: flex; flex-direction: column; flex: 1; height: calc(100vh - 52px - calc(56px + env(safe-area-inset-bottom, 0px))); overflow: hidden; }
    .wide-body { display: flex; flex-direction: row; flex: 1; overflow: hidden; }
    .wide-body .passage-scroll { height: 100%; flex: 1; padding-bottom: 0 !important; overflow-y: auto; }
    .wide-notes-col { width: 320px; flex-shrink: 0; border-left: 2px solid var(--border); background: var(--white); overflow-y: auto; position: relative; }
    .dark .wide-notes-col { background: var(--parchment-dark); }
    .bottom-panel { display: none !important; }
    .panel-backdrop { display: none !important; }

    /* Unified header spanning both columns */
    .wide-unified-header {
      display: flex; align-items: center;
      background: var(--accent);
      padding: 8px 16px 10px;
      flex-shrink: 0;
      border-bottom: none;
    }
    .dark .wide-unified-header { background: var(--gold); }
    .wide-unified-header-left { flex: 1; display: flex; align-items: center; }
    .wide-unified-header-right { display: flex; align-items: center; gap: 6px; }
    .wide-notes-label { font-family:'Lato',sans-serif; font-size:14px; font-weight:900; color:var(--ink); letter-spacing:1px; text-transform:uppercase; opacity:0.7; margin-right: 8px; }
    .wide-toggle-btn { padding:3px 10px; border-radius:12px; border:1px solid rgba(0,0,0,0.2); background:none; font-family:'Lato',sans-serif; font-size:11px; font-weight:700; color:var(--ink); cursor:pointer; transition:all 0.2s; opacity:0.75; }
    .wide-toggle-btn.active { background:rgba(0,0,0,0.15); opacity:1; border-color:transparent; }

    /* Note cards in the right column */
    .wide-note-card { margin: 0 10px 8px; padding: 8px 10px; background: var(--parchment); border: 1px solid var(--border); border-radius: 8px; font-size: 13px; }
    .dark .wide-note-card { background: var(--white); }
    .wide-note-verse-ref { font-family:'Lato',sans-serif; font-size:10px; font-weight:700; color:var(--gold); text-transform:uppercase; letter-spacing:0.5px; margin-bottom:3px; }
    .wide-note-body { font-family:'EB Garamond',serif; font-size:14px; line-height:1.5; color:var(--ink); }
    .wide-note-author { font-family:'Lato',sans-serif; font-size:10px; color:var(--ink-light); margin-top:4px; }
    .wide-note-form { margin: 0 10px 12px; }
    .wide-note-form textarea { width:100%; border:1px solid var(--border); border-radius:6px; padding:7px 9px; font-family:'EB Garamond',serif; font-size:14px; background:var(--white); color:var(--ink); resize:none; min-height:60px; outline:none; }
    .wide-note-form textarea:focus { border-color:var(--gold); }
    .wide-note-form-actions { display:flex; gap:6px; margin-top:5px; align-items:center; }
    .wide-note-submit { background:var(--gold); color:var(--ink); border:none; border-radius:6px; padding:5px 14px; font-family:'Lato',sans-serif; font-size:11px; font-weight:700; cursor:pointer; transition:opacity 0.2s; }
    .wide-note-submit:disabled { opacity:0.4; cursor:not-allowed; }
    .wide-note-cancel { background:none; border:none; font-family:'Lato',sans-serif; font-size:11px; color:var(--ink-light); cursor:pointer; }
    .wide-notes-empty { font-family:'EB Garamond',serif; font-style:italic; color:var(--ink-light); font-size:13px; padding:16px 14px; }
    .wide-notes-signin { font-family:'EB Garamond',serif; font-style:italic; color:var(--ink-light); font-size:13px; padding:12px 14px; }
    .wide-notes-signin button { background:none; border:none; color:var(--gold); cursor:pointer; text-decoration:underline; font-size:13px; font-family:'EB Garamond',serif; font-style:italic; }
  }

  /* COMMENT VISIBILITY WHEN POSTING */
  .post-visibility { display:flex; gap:6px; margin-bottom:8px; }
  .pv-btn { flex:1; padding:5px 6px; border-radius:16px; border:1px solid var(--border); background:none; font-family:'Lato',sans-serif; font-size:11px; font-weight:700; color:var(--ink-light); cursor:pointer; transition:all 0.2s; text-align:center; }
  .pv-btn.active { background:var(--gold); color:var(--ink); border-color:var(--gold); }
  .pv-group-select { width:100%; padding:5px 8px; border:1px solid var(--border); border-radius:8px; background:var(--parchment); color:var(--ink); font-family:'Lato',sans-serif; font-size:12px; outline:none; margin-bottom:8px; }
  .comment-badge { font-size:10px; border-radius:8px; padding:1px 6px; font-family:'Lato',sans-serif; font-weight:700; margin-left:4px; }
  .comment-badge.personal { background:var(--parchment-dark); color:var(--ink-light); }
  .comment-badge.group { background:rgba(139,105,20,0.15); color:var(--gold); }

  /* PROFILE / GROUPS PAGE */
  .profile-page { padding:16px 16px 100px; }
  .profile-section { margin-bottom:20px; }
  .profile-section-title { font-family:'Lato',sans-serif; font-size:10px; font-weight:700; text-transform:uppercase; letter-spacing:1px; color:var(--ink-light); margin-bottom:10px; }
  .profile-user-card { background:var(--white); border:1px solid var(--border); border-radius:10px; padding:14px 16px; display:flex; align-items:center; gap:12px; margin-bottom:16px; }
  .profile-avatar { width:44px; height:44px; border-radius:50%; background:var(--gold); display:flex; align-items:center; justify-content:center; font-family:'EB Garamond',serif; font-size:20px; color:var(--ink); font-weight:600; flex-shrink:0; }
  .profile-email { font-family:'Lato',sans-serif; font-size:13px; color:var(--ink); font-weight:700; }
  .profile-sub { font-family:'Lato',sans-serif; font-size:11px; color:var(--ink-light); margin-top:2px; }
  .group-card { background:var(--white); border:1px solid var(--border); border-radius:10px; padding:14px 16px; margin-bottom:10px; }
  .group-card-header { display:flex; align-items:center; justify-content:space-between; margin-bottom:8px; }
  .group-name { font-family:'EB Garamond',serif; font-size:17px; font-weight:600; color:var(--ink); }
  .group-role-badge { font-size:10px; font-family:'Lato',sans-serif; font-weight:700; text-transform:uppercase; letter-spacing:0.5px; padding:2px 8px; border-radius:10px; }
  .group-role-badge.admin { background:var(--gold); color:var(--ink); }
  .group-role-badge.member { background:var(--parchment-dark); color:var(--ink-light); }
  .group-role-badge.pending { background:#fff3cd; color:#856404; }
  .group-invite-row { display:flex; align-items:center; gap:8px; margin-bottom:8px; }
  .group-invite-code { font-family:'Lato',sans-serif; font-size:18px; font-weight:700; letter-spacing:3px; color:var(--gold); background:var(--parchment); border:1px dashed var(--gold); border-radius:6px; padding:4px 10px; }
  .group-invite-label { font-family:'Lato',sans-serif; font-size:10px; color:var(--ink-light); text-transform:uppercase; letter-spacing:0.5px; }
  .group-action-row { display:flex; gap:6px; flex-wrap:wrap; }
  .group-btn { padding:6px 12px; border-radius:6px; font-family:'Lato',sans-serif; font-size:12px; font-weight:700; cursor:pointer; border:none; transition:opacity 0.2s; }
  .group-btn:hover { opacity:0.85; }
  .group-btn.primary { background:var(--gold); color:var(--ink); }
  .group-btn.danger { background:#dc3545; color:white; }
  .group-btn.secondary { background:var(--parchment-dark); color:var(--ink); border:1px solid var(--border); }
  .pending-member-row { display:flex; align-items:center; justify-content:space-between; padding:8px 0; border-bottom:1px solid var(--border); }
  .pending-member-row:last-child { border-bottom:none; }
  .pending-member-email { font-family:'Lato',sans-serif; font-size:12px; color:var(--ink); flex:1; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
  .pending-actions { display:flex; gap:4px; flex-shrink:0; }
  .approve-btn { background:#28a745; color:white; border:none; border-radius:5px; padding:4px 10px; font-size:11px; font-weight:700; cursor:pointer; font-family:'Lato',sans-serif; }
  .reject-btn { background:#dc3545; color:white; border:none; border-radius:5px; padding:4px 10px; font-size:11px; font-weight:700; cursor:pointer; font-family:'Lato',sans-serif; }
  .profile-input { width:100%; padding:10px 12px; border:1px solid var(--border); border-radius:8px; background:var(--parchment); color:var(--ink); font-family:'Lato',sans-serif; font-size:14px; outline:none; margin-bottom:8px; }
  .profile-input:focus { border-color:var(--gold); }
  .profile-action-btn { width:100%; padding:11px; border-radius:8px; font-family:'Lato',sans-serif; font-size:13px; font-weight:700; cursor:pointer; border:none; transition:opacity 0.2s; margin-bottom:8px; }
  .profile-action-btn:hover { opacity:0.85; }
  .profile-action-btn.primary { background:var(--ink); color:var(--parchment); }
  .profile-action-btn.gold { background:var(--gold); color:var(--ink); }
  .profile-action-btn.danger { background:#dc3545; color:white; }
  .member-list-row { display:flex; align-items:center; justify-content:space-between; padding:6px 0; border-bottom:1px solid var(--border); }
  .member-list-row:last-child { border-bottom:none; }
  .member-name { font-family:'Lato',sans-serif; font-size:12px; color:var(--ink); }
  .member-role { font-size:10px; color:var(--ink-light); font-family:'Lato',sans-serif; }

  /* BIBLE BROWSER */
  .bible-browser { display:flex; flex-direction:column; }
  .bible-nav {
    display:flex; align-items:center; gap:6px;
    padding:8px 12px; background:var(--white);
    border-bottom:1px solid var(--border); flex-shrink:0; flex-wrap:wrap;
  }
  .bible-select {
    flex:1; min-width:120px; padding:6px 8px;
    border:1px solid var(--border); border-radius:6px;
    background:var(--parchment); color:var(--ink);
    font-family:'EB Garamond',serif; font-size:15px; cursor:pointer;
    outline:none;
  }
  .bible-select:focus { border-color:var(--gold); }
  .bible-chapter-nav { display:flex; align-items:center; gap:4px; }
  .bible-ch-btn {
    background:none; border:1px solid var(--border); border-radius:6px;
    width:30px; height:30px; cursor:pointer; font-size:16px;
    color:var(--ink-light); display:flex; align-items:center; justify-content:center;
    transition:all 0.15s; flex-shrink:0;
  }
  .bible-ch-btn:hover { background:var(--parchment-dark); border-color:var(--gold); }
  .bible-ch-btn:disabled { opacity:0.3; cursor:not-allowed; }
  .bible-ch-label {
    font-family:'Lato',sans-serif; font-size:12px; font-weight:700;
    color:var(--ink); min-width:56px; text-align:center;
  }
  .bible-search-bar {
    display:flex; align-items:center; gap:6px;
    padding:6px 12px; background:var(--parchment-dark);
    border-bottom:1px solid var(--border); flex-shrink:0;
  }
  .bible-search-input {
    flex:1; padding:6px 10px; border:1px solid var(--border); border-radius:6px;
    background:var(--white); color:var(--ink);
    font-family:'EB Garamond',serif; font-size:15px; outline:none;
  }
  .bible-search-input:focus { border-color:var(--gold); }
  .bible-search-btn {
    padding:6px 12px; background:var(--gold); color:var(--white);
    border:none; border-radius:6px; font-family:'Lato',sans-serif;
    font-size:12px; font-weight:700; cursor:pointer; white-space:nowrap;
  }
  .bible-search-btn:hover { opacity:0.85; }
  .search-results-label {
    padding:6px 16px 2px; font-family:'Lato',sans-serif; font-size:11px;
    color:var(--gold); font-weight:700; letter-spacing:0.5px; text-transform:uppercase;
  }
  .verse.search-match { background:rgba(139,105,20,0.12); border-radius:4px; }
  .dark .verse.search-match { background:rgba(201,162,39,0.15); }
  .bible-ch-input {
    width:46px; padding:4px 6px; border:1px solid var(--border); border-radius:6px;
    background:var(--parchment); color:var(--ink); font-family:'Lato',sans-serif;
    font-size:13px; font-weight:700; text-align:center; outline:none;
  }
  .bible-ch-input:focus { border-color:var(--gold); }
  .bible-ch-select {
    padding:4px 4px; border:1px solid var(--border); border-radius:6px;
    background:var(--parchment); color:var(--ink); font-family:'Lato',sans-serif;
    font-size:12px; outline:none; cursor:pointer; max-width:70px;
  }
  .bible-ch-select:focus { border-color:var(--gold); }
  .search-scope-toggle {
    display:flex; align-items:center; gap:4px; white-space:nowrap;
    font-family:'Lato',sans-serif; font-size:11px; color:var(--ink-light); cursor:pointer;
    padding:0 2px;
  }
  .search-scope-toggle input { cursor:pointer; accent-color:var(--gold); }
  .global-results { padding:0 16px 80px; }
  .global-result-card {
    border:1px solid var(--border); border-radius:8px;
    padding:10px 12px; margin-bottom:8px; background:var(--white); cursor:pointer;
    transition:border-color 0.15s;
  }
  .global-result-card:hover { border-color:var(--gold); }
  .global-result-ref {
    font-family:'Lato',sans-serif; font-size:11px; font-weight:700;
    color:var(--gold); text-transform:uppercase; letter-spacing:0.5px; margin-bottom:4px;
  }
  .global-result-text {
    font-family:Georgia,serif; font-size:15px; line-height:1.6; color:var(--ink);
  }
  .global-result-text mark {
    background:#fff176; color:#1a1209; border-radius:2px; padding:0 1px;
  }
  .dark .global-result-text mark { background:#c9a227; color:#1a1209; }
  .no-results { font-family:'EB Garamond',serif; font-style:italic; color:var(--ink-light); padding:20px 0; text-align:center; font-size:16px; }

  /* VERSION SWITCHER */
  .version-switcher {
    display: flex;
    align-items: center;
    background: rgba(255,255,255,0.08);
    border-radius: 6px;
    padding: 2px;
    gap: 1px;
  }
  .version-btn {
    background: none;
    border: none;
    color: var(--gold-light);
    font-family: 'Lato', sans-serif;
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.3px;
    padding: 3px 6px;
    border-radius: 4px;
    cursor: pointer;
    transition: all 0.15s;
    line-height: 1;
  }
  .version-btn.active { background: var(--accent); color: var(--ink); }
  .version-btn:not(.active):hover { color: var(--accent); }

  /* COLOUR PICKER OVERLAY */
  .colour-picker-overlay { position:fixed; inset:0; z-index:600; display:flex; align-items:center; justify-content:center; background:rgba(0,0,0,0.5); padding:20px; }
  .colour-picker-card { background:var(--white); border-radius:12px; padding:20px; width:100%; max-width:320px; border-top:3px solid var(--gold); }
  .colour-picker-title { font-family:'EB Garamond',serif; font-size:18px; margin-bottom:14px; color:var(--ink); }
  .colour-grid { display:grid; grid-template-columns:repeat(6,1fr); gap:8px; margin-bottom:14px; }
  .colour-cell { width:36px; height:36px; border-radius:8px; cursor:pointer; border:2px solid transparent; transition:transform 0.15s, border-color 0.15s; }
  .colour-cell:hover { transform:scale(1.15); border-color:var(--ink); }
  .custom-colour-row { display:flex; align-items:center; gap:10px; margin-bottom:14px; }
  .custom-colour-input { width:48px; height:36px; border:1px solid var(--border); border-radius:6px; cursor:pointer; padding:2px; }
  .custom-colour-label { font-family:'Lato',sans-serif; font-size:12px; color:var(--ink-light); }
  .picker-actions { display:flex; gap:8px; }
  .picker-btn { flex:1; padding:9px; border-radius:6px; font-family:'Lato',sans-serif; font-size:12px; font-weight:700; cursor:pointer; border:none; transition:opacity 0.2s; }
  .picker-btn.primary { background:var(--red); color:white; }
  .picker-btn.secondary { background:var(--parchment-dark); color:var(--ink); }
  .picker-btn:hover { opacity:0.85; }
`;

// ─── BOOK NAME NORMALISER ─────────────────────────────────────────────────────
const BOOK_ALIASES = {
  "1 chron.": "1 Chronicles", "2 chron.": "2 Chronicles",
  "rev": "Revelation", "psalm": "Psalms",
};
function normaliseBookName(raw) {
  const lower = raw.trim().toLowerCase();
  if (BOOK_ALIASES[lower]) return BOOK_ALIASES[lower];
  return raw.trim().replace(/\b\w/g, c => c.toUpperCase());
}

// ─── PARSE PASSAGE REFERENCE ─────────────────────────────────────────────────
function parsePassageRef(ref) {
  const display = ref.trim();
  const lower = display.toLowerCase();
  if (lower.includes("2 john") && lower.includes("3 john")) {
    return { books: [{ book: "2 John", chapters: [] }, { book: "3 John", chapters: [] }], display };
  }
  const psalmVerseMatch = display.match(/^(.*?)\s+(\d+):(\d+)-(\d+)$/);
  if (psalmVerseMatch) {
    return { books: [{ book: normaliseBookName(psalmVerseMatch[1]), chapters: [parseInt(psalmVerseMatch[2])] }], display };
  }
  const match = display.match(/^(.*?)\s+([\d][\d,\-\s]*)$/);
  if (!match) {
    return { books: [{ book: normaliseBookName(display), chapters: [] }], display };
  }
  const book = normaliseBookName(match[1].trim());
  const chapters = match[2].trim().split(",").flatMap(p => {
    p = p.trim();
    if (p.includes("-")) {
      const [a, b] = p.split("-").map(Number);
      return Array.from({ length: b - a + 1 }, (_, i) => a + i);
    }
    const n = parseInt(p);
    return isNaN(n) ? [] : [n];
  });
  return { books: [{ book, chapters }], display };
}

// ─── FETCH VERSES FROM SUPABASE ───────────────────────────────────────────────
const verseCache = {};
async function fetchVerses(book, chapters, version = 'KJV') {
  const key = `${version}-${book}-${chapters.join(",")}`;
  if (verseCache[key]) return verseCache[key];
  let query = supabase
    .from("bible_verses")
    .select("chapter, verse, text")
    .eq("book", book)
    .eq("version", version)
    .order("chapter", { ascending: true })
    .order("verse",   { ascending: true });
  if (chapters.length > 0) query = query.in("chapter", chapters);
  const { data, error } = await query;
  if (error) { console.error(error); return []; }
  verseCache[key] = data || [];
  return verseCache[key];
}

// ─── HELPER: render verse text with annotations ───────────────────────────────
function AnnotatedVerse({ text, annotations }) {
  if (!annotations || annotations.length === 0) return <>{text}</>;

  // Build sorted, non-overlapping spans
  const sorted = [...annotations].sort((a, b) => a.start_offset - b.start_offset);
  const parts = [];
  let cursor = 0;

  for (const ann of sorted) {
    const s = Math.max(0, ann.start_offset);
    const e = Math.min(text.length, ann.end_offset);
    if (s >= e || s < cursor) continue;
    if (s > cursor) parts.push(<span key={cursor}>{text.slice(cursor, s)}</span>);
    const spanStyle = ann.style === "underline"
      ? { borderBottom: `2px solid ${ann.colour}`, textDecoration: "none" }
      : { backgroundColor: ann.colour, borderRadius: "2px", color: "#1a1209" };
    parts.push(<span key={s} style={spanStyle}>{text.slice(s, e)}</span>);
    cursor = e;
  }
  if (cursor < text.length) parts.push(<span key={cursor}>{text.slice(cursor)}</span>);
  return <>{parts}</>;
}

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
export default function App() {
  const today = new Date();
  const [currentDate, setCurrentDate]   = useState(today);
  const [activeTab, setActiveTab]       = useState(0);
  const [passageVerses, setPassageVerses] = useState([]);
  const [passageLoading, setPassageLoading] = useState(false);
  const checkWide = () => window.innerWidth >= 768 || (window.innerWidth > window.innerHeight && window.innerHeight <= 500);
  const [isWide, setIsWide] = useState(checkWide);
  const [visibleChapter, setVisibleChapter] = useState(null);
  const [fontSize, setFontSize]         = useState(18);
  const [showSettings, setShowSettings] = useState(false);
  const [showVersionPicker, setShowVersionPicker] = useState(false);

  // Panel state
  const [panelOpen, setPanelOpen]       = useState(false);
  const [panelHeight, setPanelHeight]   = useState(45); // % of vh
  const [panelAnchor, setPanelAnchor]   = useState(null); // { verseKey, text } | null

  // Comments
  const [comments, setComments]         = useState([]);
  const [commentText, setCommentText]   = useState("");
  const [submitting, setSubmitting]     = useState(false);

  // Annotations (highlights/underlines) — personal
  const [annotations, setAnnotations]   = useState({}); // key: "book-ch-vs" → []
  const [annLoading, setAnnLoading]     = useState(false);

  // Selection toolbar
  const [selToolbar, setSelToolbar]     = useState(null); // { x, y, verseKey, verseText, start, end, selectedText }
  const [showColourPicker, setShowColourPicker] = useState(false);
  const [pickerMode, setPickerMode]     = useState("highlight"); // "highlight"|"underline"
  const [pickerColour, setPickerColour] = useState(HIGHLIGHT_COLOURS[0].bg);
  const [pendingSel, setPendingSel]     = useState(null);

  // Auth
  const [user, setUser]                 = useState(null);
  const [showAuth, setShowAuth]         = useState(false);
  const [authMode, setAuthMode]         = useState("login");
  const [authEmail, setAuthEmail]       = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authError, setAuthError]       = useState("");
  const [authLoading, setAuthLoading]   = useState(false);
  const [toast, setToast]               = useState(null);

  const MIN_FONT = 14; const MAX_FONT = 28;

  // Bible browser state
  const [browserBook, setBrowserBook]       = useState("Genesis");
  const [browserChapter, setBrowserChapter] = useState(1);
  const [browserChapterInput, setBrowserChapterInput] = useState("1");
  const [browserVerses, setBrowserVerses]   = useState([]);
  const [browserLoading, setBrowserLoading] = useState(false);
  const [browserAnnotations, setBrowserAnnotations] = useState({});
  const [browserComments, setBrowserComments] = useState([]);
  const [searchQuery, setSearchQuery]       = useState("");
  const [searchMatches, setSearchMatches]   = useState(new Set()); // Set of "ch-vs" for chapter view
  const [globalSearch, setGlobalSearch]     = useState(false);     // true = searching whole Bible
  const [globalResults, setGlobalResults]   = useState([]);        // [{book,chapter,verse,text}]
  const [globalSearching, setGlobalSearching] = useState(false);
  const [globalQuery, setGlobalQuery]       = useState("");
  const [darkMode, setDarkMode] = useState(() => {
    try { return localStorage.getItem('bibleDarkMode') === 'true'; } catch { return false; }
  });
  function toggleDark() {
    setDarkMode(prev => {
      try { localStorage.setItem('bibleDarkMode', String(!prev)); } catch {}
      return !prev;
    });
  }

  const VERSIONS = ['KJV', 'ESV'];
  const [bibleVersion, setBibleVersion] = useState(() => {
    try { return localStorage.getItem('bibleVersion') || 'KJV'; } catch { return 'KJV'; }
  });
  function switchVersion(v) {
    setBibleVersion(v);
    try { localStorage.setItem('bibleVersion', v); } catch {}
    Object.keys(verseCache).forEach(k => delete verseCache[k]);
  }

  // ── Group state ─────────────────────────────────────────────────────────
  const [userGroups, setUserGroups]           = useState([]); // approved + pending memberships
  const [pendingRequests, setPendingRequests] = useState({}); // groupId → [members]
  const [groupMembers, setGroupMembers]       = useState({}); // groupId → [members]
  const [commentView, setCommentView]         = useState("personal"); // "personal" | "group"
  const [selectedGroupId, setSelectedGroupId] = useState(null); // which group to view
  const [postVisibility, setPostVisibility]   = useState("personal"); // "personal" | "group"
  const [postGroupId, setPostGroupId]         = useState(null);
  const [groupsLoading, setGroupsLoading]     = useState(false);
  // Profile page sub-views
  const [profileView, setProfileView]         = useState("main"); // "main"|"create"|"join"|"manage"
  const [manageGroupId, setManageGroupId]     = useState(null);
  const [newGroupName, setNewGroupName]       = useState("");
  const [joinCode, setJoinCode]               = useState("");
  const [groupActionLoading, setGroupActionLoading] = useState(false);
  const [groupActionError, setGroupActionError]     = useState("");
  const dateKey  = `${currentDate.getMonth()+1}-${currentDate.getDate()}`;
  const readings = READING_PLAN[dateKey] || [];

  // ── Auth ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setUser(data.session?.user ?? null));
    const { data: l } = supabase.auth.onAuthStateChange((_e, s) => setUser(s?.user ?? null));
    return () => l.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const handleResize = () => setIsWide(checkWide());
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // ── Load user's groups ────────────────────────────────────────────────────
  useEffect(() => {
    if (!user) { setUserGroups([]); return; }
    setGroupsLoading(true);
    supabase.from("group_members")
      .select("*, groups(*)")
      .eq("user_id", user.id)
      .in("status", ["approved","pending"])
      .then(({ data }) => {
        setUserGroups(data || []);
        setGroupsLoading(false);
        const first = (data || []).find(m => m.status === "approved");
        if (first) setPostGroupId(p => p || first.group_id);
        if (first) setSelectedGroupId(p => p || first.group_id);
      });
  }, [user]); // eslint-disable-line

  async function loadPendingRequests(groupId) {
    const { data } = await supabase.from("group_members").select("*").eq("group_id", groupId).eq("status","pending");
    setPendingRequests(prev => ({ ...prev, [groupId]: data || [] }));
  }
  async function loadGroupMembers(groupId) {
    const { data } = await supabase.from("group_members").select("*").eq("group_id", groupId).eq("status","approved");
    setGroupMembers(prev => ({ ...prev, [groupId]: data || [] }));
  }
  function generateCode() { return Math.random().toString(36).substring(2,8).toUpperCase(); }

  async function handleCreateGroup() {
    if (!newGroupName.trim() || !user) return;
    setGroupActionLoading(true); setGroupActionError("");
    const code = generateCode();
    const { data: grp, error: grpErr } = await supabase.from("groups")
      .insert({ name: newGroupName.trim(), created_by: user.id, invite_code: code }).select().single();
    if (grpErr) { setGroupActionError(grpErr.message); setGroupActionLoading(false); return; }
    await supabase.from("group_members").insert({
      group_id: grp.id, user_id: user.id, role:"admin", status:"approved",
      email: user.email, username: user.user_metadata?.username || user.email.split("@")[0]
    });
    setNewGroupName(""); setProfileView("main");
    const { data } = await supabase.from("group_members").select("*, groups(*)").eq("user_id", user.id).in("status",["approved","pending"]);
    setUserGroups(data || []); setGroupActionLoading(false); showToast("Group created!");
  }

  async function handleJoinGroup() {
    if (!joinCode.trim() || !user) return;
    setGroupActionLoading(true); setGroupActionError("");
    const { data: grp } = await supabase.from("groups").select("*").eq("invite_code", joinCode.trim().toUpperCase()).single();
    if (!grp) { setGroupActionError("Invalid invite code"); setGroupActionLoading(false); return; }
    const { data: existing } = await supabase.from("group_members").select("*").eq("group_id", grp.id).eq("user_id", user.id).maybeSingle();
    if (existing) { setGroupActionError("You are already in this group"); setGroupActionLoading(false); return; }
    await supabase.from("group_members").insert({
      group_id: grp.id, user_id: user.id, role:"member", status:"pending",
      email: user.email, username: user.user_metadata?.username || user.email.split("@")[0]
    });
    setJoinCode(""); setProfileView("main");
    const { data } = await supabase.from("group_members").select("*, groups(*)").eq("user_id", user.id).in("status",["approved","pending"]);
    setUserGroups(data || []); setGroupActionLoading(false); showToast("Request sent — waiting for approval");
  }

  async function handleApproveMember(groupId, memberId) {
    await supabase.from("group_members").update({ status:"approved" }).eq("id", memberId);
    loadPendingRequests(groupId); loadGroupMembers(groupId);
  }
  async function handleRejectMember(groupId, memberId) {
    await supabase.from("group_members").update({ status:"rejected" }).eq("id", memberId);
    loadPendingRequests(groupId);
  }
  async function handleRemoveMember(groupId, memberId) {
    await supabase.from("group_members").delete().eq("id", memberId);
    loadGroupMembers(groupId);
  }
  async function handleLeaveGroup(groupId) {
    await supabase.from("group_members").delete().eq("group_id", groupId).eq("user_id", user.id);
    setUserGroups(prev => prev.filter(m => m.group_id !== groupId)); showToast("Left group");
  }
  async function handleDeleteGroup(groupId) {
    await supabase.from("groups").delete().eq("id", groupId);
    setUserGroups(prev => prev.filter(m => m.group_id !== groupId));
    setProfileView("main"); showToast("Group deleted");
  }

  // ── Auto-fetch comments when view/date/user changes ──────────────────────
  useEffect(() => {
    fetchComments();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [commentView, selectedGroupId, dateKey, user, panelAnchor, isWide]);

  // ── Measure verse offsets for parallel notes column ──────────────────────
  useEffect(() => {
    if (!isWide || passageVerses.length === 0) return;
    const measure = () => {
      const offsets = {};
      Object.entries(verseEls.current).forEach(([key, el]) => {
        if (el) offsets[key] = el.offsetTop;
      });
      setVerseOffsets(offsets);
    };
    // Small delay to let DOM settle after render
    const t = setTimeout(measure, 80);
    return () => clearTimeout(t);
  }, [passageVerses, isWide, activeTab]);

  // ── Load passage ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (activeTab >= readings.length) return;
    const ref = readings[activeTab];
    if (!ref) return;
    setPassageLoading(true);
    setPassageVerses([]);
    setVisibleChapter(null);
    const parsed = parsePassageRef(ref);
    Promise.all(parsed.books.map(({ book, chapters }) => fetchVerses(book, chapters, bibleVersion)))
      .then(r => { setPassageVerses(r.flat()); setPassageLoading(false); })
      .catch(() => setPassageLoading(false));
  }, [activeTab, dateKey, bibleVersion]);

  // ── Load annotations for current reading ─────────────────────────────────
  useEffect(() => {
    if (!user || activeTab >= readings.length) return;
    const parsed = parsePassageRef(readings[activeTab]);
    const book = parsed.books[0].book;
    const chapters = parsed.books[0].chapters;
    setAnnLoading(true);
    let q = supabase.from("annotations")
      .select("*").eq("user_id", user.id).eq("book", book);
    if (chapters.length) q = q.in("chapter", chapters);
    q.then(({ data }) => {
      if (data) {
        const map = {};
        data.forEach(a => {
          const k = `${a.book}-${a.chapter}-${a.verse}`;
          if (!map[k]) map[k] = [];
          map[k].push(a);
        });
        setAnnotations(map);
      }
      setAnnLoading(false);
    });
  }, [user, activeTab, dateKey]);

  // ── Load bible browser chapter ───────────────────────────────────────────
  useEffect(() => {
    if (activeTab !== readings.length + 1) return;
    setBrowserLoading(true);
    setBrowserVerses([]);
    setSearchMatches(new Set());
    fetchVerses(browserBook, [browserChapter], bibleVersion).then(verses => {
      setBrowserVerses(verses);
      setBrowserLoading(false);
    });
    // Load annotations for this chapter
    if (user) {
      supabase.from("annotations").select("*")
        .eq("user_id", user.id).eq("book", browserBook).eq("chapter", browserChapter)
        .then(({ data }) => {
          if (data) {
            const map = {};
            data.forEach(a => {
              const k = `${a.book}-${a.chapter}-${a.verse}`;
              if (!map[k]) map[k] = [];
              map[k].push(a);
            });
            setBrowserAnnotations(map);
          }
        });
    }
    // Load comments count per verse for this chapter
    supabase.from("comments").select("verse_ref")
      .eq("date", `bible-${browserBook}-${browserChapter}`)
      .then(({ data }) => setBrowserComments(data || []));
  }, [activeTab, browserBook, browserChapter, user, bibleVersion]);

  function handleBrowserSearch() {
    if (!searchQuery.trim()) {
      setSearchMatches(new Set()); setGlobalSearch(false); setGlobalResults([]); return;
    }
    const q = searchQuery.trim();

    if (globalSearch) {
      // Full Bible search via Supabase ilike — filtered to current version
      setGlobalSearching(true);
      setGlobalResults([]);
      setGlobalQuery(q);
      supabase.from("bible_verses")
        .select("book, chapter, verse, text")
        .ilike("text", `%${q}%`)
        .eq("version", bibleVersion)
        .order("book").order("chapter").order("verse")
        .limit(200)
        .then(({ data, error }) => {
          setGlobalResults(data || []);
          setGlobalSearching(false);
        });
    } else {
      // Chapter-only search
      const qLower = q.toLowerCase();
      const matches = new Set();
      browserVerses.forEach(v => {
        if (v.text.toLowerCase().includes(qLower)) matches.add(`${v.chapter}-${v.verse}`);
      });
      setSearchMatches(matches);
      setGlobalQuery(q);
    }
  }

  function navigateChapter(delta) {
    const max = CHAPTER_COUNTS[browserBook] || 1;
    const next = browserChapter + delta;
    if (next < 1 || next > max) return;
    setBrowserChapter(next);
    setBrowserChapterInput(String(next));
  }

  function handleChapterInputChange(val) {
    setBrowserChapterInput(val);
    const n = parseInt(val);
    const max = CHAPTER_COUNTS[browserBook] || 1;
    if (!isNaN(n) && n >= 1 && n <= max) {
      setBrowserChapter(n);
    }
  }

  function handleChapterSelectChange(val) {
    const n = parseInt(val);
    setBrowserChapter(n);
    setBrowserChapterInput(String(n));
  }

  function handleBrowserVerseMouseUp(e, verse) {
    if (!user) return;
    const verseEl = e.currentTarget.querySelector(".verse-body");
    if (!verseEl) return;
    setTimeout(() => {
      const sel = window.getSelection();
      if (!sel || sel.isCollapsed || sel.rangeCount === 0) return;
      const selectedText = sel.toString().trim();
      if (!selectedText || selectedText.length < 2) return;
      const range = sel.getRangeAt(0);
      function getOffset(rootEl, targetNode, targetOffset) {
        const walker = document.createTreeWalker(rootEl, NodeFilter.SHOW_TEXT);
        let total = 0;
        while (walker.nextNode()) {
          const node = walker.currentNode;
          if (node === targetNode) return total + targetOffset;
          total += node.textContent.length;
        }
        return total;
      }
      const start = verseEl.contains(range.startContainer)
        ? getOffset(verseEl, range.startContainer, range.startOffset) : 0;
      const end = verseEl.contains(range.endContainer)
        ? getOffset(verseEl, range.endContainer, range.endOffset) : selectedText.length;
      const verseKey = `${verse.book}-${verse.chapter}-${verse.verse}`;
      const rect = range.getBoundingClientRect();
      const toolbarX = Math.max(4, Math.min(rect.left + rect.width/2 - 140, window.innerWidth - 284));
      const toolbarY = Math.max(8, rect.top - 60);
      setSelToolbar({ x:toolbarX, y:toolbarY, verseKey, verseText:verse.text,
        start, end, selectedText, chapter:verse.chapter, verse:verse.verse, book:verse.book,
        isBrowser: true });
    }, 10);
  }

  async function fetchComments() {
    // Don't fetch personal comments if not logged in
    if (commentView === "personal" && !user) {
      setComments([]);
      return;
    }
    // Don't fetch group comments if no group selected
    if (commentView === "group" && !selectedGroupId) {
      setComments([]);
      return;
    }
    let q = supabase.from("comments").select("*").eq("date", dateKey).order("created_at");
    if (!isWide && panelAnchor) q = q.eq("verse_ref", panelAnchor.verseKey);
    if (commentView === "personal") {
      q = q.eq("visibility","personal").eq("user_id", user.id);
    } else if (commentView === "group" && selectedGroupId) {
      q = q.eq("visibility","group").eq("group_id", selectedGroupId);
    }
    const { data } = await q;
    setComments(data || []);
  }

  async function handlePostComment() {
    if (!commentText.trim() || !user) return;
    setSubmitting(true);
    const isGroup = postVisibility === "group" && postGroupId;
    await supabase.from("comments").insert({
      date: dateKey,
      user_id: user.id,
      email: user.email,
      username: user.user_metadata?.username || user.email.split("@")[0],
      text: commentText.trim(),
      verse_ref: panelAnchor?.verseKey || null,
      anchor_text: panelAnchor?.text || null,
      visibility: isGroup ? "group" : "personal",
      group_id: isGroup ? postGroupId : null,
    });
    setCommentText("");
    await fetchComments();
    if (isWide) setPanelAnchor(null);
    setSubmitting(false);
  }

  // ── Text selection → toolbar ──────────────────────────────────────────────
  function handleVerseMouseUp(e, verse) {
    if (!user) return;
    // Capture the DOM element before React nullifies the synthetic event
    const verseEl = e.currentTarget.querySelector(".verse-body");
    if (!verseEl) return;

    setTimeout(() => {
      const sel = window.getSelection();
      if (!sel || sel.isCollapsed || sel.rangeCount === 0) return;
      const selectedText = sel.toString().trim();
      if (!selectedText || selectedText.length < 2) return;

      const range = sel.getRangeAt(0);

      // Calculate character offsets by walking text nodes
      function getOffset(rootEl, targetNode, targetOffset) {
        const walker = document.createTreeWalker(rootEl, NodeFilter.SHOW_TEXT);
        let total = 0;
        while (walker.nextNode()) {
          const node = walker.currentNode;
          if (node === targetNode) return total + targetOffset;
          total += node.textContent.length;
        }
        return total;
      }

      const start = verseEl.contains(range.startContainer)
        ? getOffset(verseEl, range.startContainer, range.startOffset) : 0;
      const end = verseEl.contains(range.endContainer)
        ? getOffset(verseEl, range.endContainer, range.endOffset) : selectedText.length;

      const verseKey = `${verse.book}-${verse.chapter}-${verse.verse}`;
      const rect = range.getBoundingClientRect();
      const toolbarX = Math.max(4, Math.min(rect.left + rect.width/2 - 140, window.innerWidth - 284));
      const toolbarY = Math.max(8, rect.top - 60);

      setSelToolbar({
        x: toolbarX, y: toolbarY,
        verseKey, verseText: verse.text,
        start, end, selectedText,
        chapter: verse.chapter, verse: verse.verse,
        book: verse.book,
      });
    }, 10);
  }

  function dismissToolbar() {
    setSelToolbar(null);
    window.getSelection()?.removeAllRanges();
  }

  async function applyAnnotation(colour, style) {
    if (!selToolbar || !user) return;
    const { verseKey, start, end, chapter, verse, book } = selToolbar;
    const parsed = parsePassageRef(readings[activeTab]);
    const bookName = book || parsed.books[0].book;

    const { data, error } = await supabase.from("annotations").insert({
      user_id: user.id,
      book: bookName,
      chapter, verse,
      start_offset: start, end_offset: end,
      colour, style,
      shared: false,
    }).select().single();
    if (error) { console.error("Annotation error:", error); showToast("Could not save highlight — run add_annotations.sql first"); return; }
    // Update the right annotation map (reading or browser)
    const isBrowser = selToolbar.isBrowser;

    if (!error && data) {
      const k = `${bookName}-${chapter}-${verse}`;
      if (isBrowser) {
        setBrowserAnnotations(prev => ({ ...prev, [k]: [...(prev[k] || []), data] }));
      } else {
        setAnnotations(prev => ({ ...prev, [k]: [...(prev[k] || []), data] }));
      }
    }
    dismissToolbar();
  }

  function openCommentFromSel() {
    if (!selToolbar) return;
    setPanelAnchor({ verseKey: selToolbar.verseKey, text: selToolbar.selectedText });
    setPanelOpen(true);
    dismissToolbar();
  }

  // ── Panel drag ────────────────────────────────────────────────────────────
  const dragRef = useRef(null);
  const verseEls = useRef({}); // verseKey → DOM element
  const [verseOffsets, setVerseOffsets] = useState({}); // verseKey → offsetTop relative to passage container
  function onDragStart(e) {
    const startY = e.type === "touchstart" ? e.touches[0].clientY : e.clientY;
    const startH = panelHeight;
    function onMove(ev) {
      const y = ev.type === "touchmove" ? ev.touches[0].clientY : ev.clientY;
      const delta = ((startY - y) / window.innerHeight) * 100;
      setPanelHeight(Math.min(85, Math.max(25, startH + delta)));
    }
    function onEnd() {
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onEnd);
      document.removeEventListener("touchmove", onMove);
      document.removeEventListener("touchend", onEnd);
    }
    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onEnd);
    document.addEventListener("touchmove", onMove, { passive: true });
    document.addEventListener("touchend", onEnd);
  }

  // ── Footnote counts per verse ─────────────────────────────────────────────
  const footnoteCounts = {};
  comments.filter(c => c.verse_ref).forEach(c => {
    footnoteCounts[c.verse_ref] = (footnoteCounts[c.verse_ref] || 0) + 1;
  });

  // ── Superscript number helper ─────────────────────────────────────────────
  const superNums = ["¹","²","³","⁴","⁵","⁶","⁷","⁸","⁹"];
  function supNum(n) { return n <= 9 ? superNums[n-1] : `(${n})`; }

  function openPanelForVerse(verseKey, text) {
    setPanelAnchor({ verseKey, text });
    if (!isWide) setPanelOpen(true);
  }

  async function handleAuth() {
    setAuthLoading(true); setAuthError("");
    if (authMode === "login") {
      const { error } = await supabase.auth.signInWithPassword({ email: authEmail, password: authPassword });
      if (error) setAuthError(error.message); else setShowAuth(false);
    } else {
      const { error } = await supabase.auth.signUp({ email: authEmail, password: authPassword,
        options: { data: { username: authEmail.split("@")[0] } } });
      if (error) setAuthError(error.message);
      else { showToast("Check your email to confirm!"); setShowAuth(false); }
    }
    setAuthLoading(false);
  }

  function showToast(msg) { setToast(msg); setTimeout(() => setToast(null), 3000); }
  function handleShare() {
    const url = `${window.location.origin}${window.location.pathname}?date=${dateKey}`;
    try { navigator.clipboard.writeText(url).then(() => showToast("Link copied!")); } catch { showToast("Link: " + url); }
  }
  function goDay(delta) { const d = new Date(currentDate); d.setDate(d.getDate()+delta); setCurrentDate(d); setActiveTab(0); setPanelOpen(false); }
  function goToday() { setCurrentDate(new Date()); setActiveTab(0); setPanelOpen(false); }
  const isToday = currentDate.toDateString() === today.toDateString();
  const formattedDate = currentDate.toLocaleDateString("en-US", { weekday:"long", month:"long", day:"numeric" });

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className={darkMode ? "app dark" : "app"}>
      <style>{styles}</style>

{/* FIXED TOP HEADER */}
      <div className="header">
        <div className="header-left">
          <button className="version-btn active" onClick={() => setShowVersionPicker(true)}
            style={{fontSize:"15px", fontWeight:"700", background:"none", border:"none", 
            color: darkMode ? "var(--ink)" : "var(--ink)", cursor:"pointer", padding:"4px 6px"}}>
            {bibleVersion}
          </button>
        </div>
        <div className="header-center">
          <button className="header-nav-btn" onClick={() => goDay(-1)}>‹</button>
          <div style={{textAlign:"center"}}>
            <div className="header-date-display">
              {currentDate.toLocaleDateString("en-US",{month:"short",day:"numeric"})}
            </div>
            {!isToday && <button className="today-chip" onClick={goToday}>Today</button>}
          </div>
          <button className="header-nav-btn" onClick={() => goDay(1)}>›</button>
        </div>
        <div className="header-right">
          <button className="header-icon-btn" onClick={() => setShowSettings(true)}
            title="Settings"
            style={{fontSize:"18px", background:"none", border:"none", cursor:"pointer", padding:"4px 6px"}}>
            ≡
          </button>
        </div>
      </div>
      <div className="header-spacer" />


      {/* BOTTOM TAB BAR */}
      {readings.length > 0 ? (<>
        <div className="tabs">
          {readings.map((r, i) => (
            <button key={i} className={`tab${activeTab===i?" active":""}`} onClick={() => { setActiveTab(i); setPanelOpen(false); }}>
              <span className="tab-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={darkMode && activeTab===i ? "var(--ink)" : "currentColor"} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>
              </span>
              <span className="tab-label">READING {String(i+1).padStart(2,"0")}</span>
            </button>
          ))}
          <button className={`tab${activeTab===readings.length?" active":""}`}
            onClick={() => { setActiveTab(readings.length); setPanelAnchor(null); setPanelOpen(true); }}>
            <span className="tab-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={darkMode && activeTab===readings.length ? "var(--ink)" : "currentColor"} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
            </span>
            <span className="tab-label">NOTES</span>
          </button>
          <button className={`tab${activeTab===readings.length+1?" active":""}`}
            onClick={() => { setActiveTab(readings.length+1); setPanelOpen(false); }}>
            <span className="tab-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={darkMode && activeTab===readings.length+1 ? "var(--ink)" : "currentColor"} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            </span>
            <span className="tab-label">SEARCH</span>
          </button>
          <button className={`tab${activeTab===readings.length+2?" active":""}`}
            onClick={() => { setActiveTab(readings.length+2); setPanelOpen(false); setProfileView("main"); }}>
            <span className="tab-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={darkMode && activeTab===readings.length+2 ? "var(--ink)" : "currentColor"} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
            </span>
            <span className="tab-label">PROFILE</span>
          </button>
        </div>

        {/* PASSAGE SCROLL AREA */}
        {activeTab < readings.length && (() => {
          const parsed = parsePassageRef(readings[activeTab]);
          const bookName = parsed.books[0].book;
          const displayBook = bookName.toUpperCase();
          const allChapters = parsed.books[0].chapters;
          const chapterToShow = visibleChapter ?? (passageVerses[0]?.chapter ?? "");
          return (
          <div className={isWide ? "wide-wrapper" : ""}>

          {/* UNIFIED HEADER — wide screens only, spans both columns */}
          {isWide && (
            <div className="wide-unified-header">
              <div className="wide-unified-header-left">
                <span className="floating-title-book" style={{color:"var(--ink)"}}>{displayBook}</span>
                {allChapters.length > 1 ? (
                  allChapters.map(ch => (
                    <span key={ch} className="floating-title-chapter" style={{
                      color:"var(--ink)", opacity: ch === chapterToShow ? 1 : 0.35, marginLeft:"8px"
                    }}>{ch}</span>
                  ))
                ) : (
                  <span className="floating-title-chapter" style={{color:"var(--ink)", marginLeft:"4px"}}>{chapterToShow}</span>
                )}
                <span className="wide-notes-label" style={{marginLeft:"16px"}}>Notes</span>
              </div>
              <div className="wide-unified-header-right">
                {user && (<>
                  <button className={`wide-toggle-btn${commentView==="personal"?" active":""}`}
                    onClick={() => setCommentView("personal")}>🔒 Private</button>
                  {userGroups.filter(m=>m.status==="approved").length > 0 && (
                    <button className={`wide-toggle-btn${commentView==="group"?" active":""}`}
                      onClick={() => setCommentView("group")}>👥 Public</button>
                  )}
                </>)}
              </div>
            </div>
          )}

          <div className={isWide ? "wide-body" : ""}>
          <div className="passage-scroll" style={{ paddingBottom: !isWide && panelOpen ? `${panelHeight + 5}vh` : "0" }}>
            <div className="passage-container" style={{"--reading-size": fontSize+"px"}}>
              {(() => {
                return isWide ? null : (
                  <div className="floating-title" style={{background: darkMode ? "var(--gold)" : "var(--accent)"}}>
                    <span className="floating-title-book" style={{color:"var(--ink)"}}>{displayBook}</span>
                    {allChapters.length > 1 ? (
                      allChapters.map(ch => (
                        <span key={ch} className="floating-title-chapter" style={{
                          color:"var(--ink)",
                          opacity: ch === chapterToShow ? 1 : 0.35,
                          marginLeft:"8px"
                        }}>{ch}</span>
                      ))
                    ) : (
                      <span className="floating-title-chapter" style={{color:"var(--ink)"}}>{chapterToShow}</span>
                    )}
                  </div>
                );
              })()}
              {passageLoading ? (
                <div className="loading-text" style={{padding:"40px 18px"}}>Loading passage…</div>
              ) : passageVerses.length > 0 ? (
                <div className="passage-text"
                  ref={el => {
                    if (!el) return;
                    const markers = el.querySelectorAll("[data-chapter-marker]");
                    if (!markers.length) return;
                    const obs = new IntersectionObserver(entries => {
                      let topmost = null;
                      entries.forEach(entry => {
                        if (entry.isIntersecting) {
                          const ch = parseInt(entry.target.dataset.chapterMarker);
                          if (topmost === null || ch < topmost) topmost = ch;
                        }
                      });
                      if (topmost !== null) setVisibleChapter(topmost);
                    }, { threshold: 0, rootMargin: "0px 0px -80% 0px" });
                    markers.forEach(m => obs.observe(m));
                  }}>
                  {(() => {
                    const parsed = parsePassageRef(readings[activeTab]);
                    const bookName = parsed.books[0].book;
                    let lastChapter = null;
                    return passageVerses.map((v, i) => {
                      const vKey = `${bookName}-${v.chapter}-${v.verse}`;
                      const anns = annotations[vKey] || [];
                      const fnCount = footnoteCounts[vKey] || 0;
                      const isNewChapter = v.chapter !== lastChapter;
                      lastChapter = v.chapter;
                      return (
                        <div key={i} ref={el => {
                          if (el) verseEls.current[vKey] = el;
                        }}>
                          {isNewChapter && (
                            <span data-chapter-marker={v.chapter} style={{display:"block",height:0,overflow:"hidden"}} />
                          )}
                          <p className="verse"
                            onMouseUp={e => handleVerseMouseUp(e, {...v, book: bookName})}
                            onTouchEnd={e => handleVerseMouseUp(e, {...v, book: bookName})}>
                            <span className="verse-num">{v.verse}</span>
                            <span className="verse-body"><AnnotatedVerse text={v.text} annotations={anns} /></span>
                            {fnCount > 0 && (
                              <span className="verse-footnote" onClick={e => { e.stopPropagation(); openPanelForVerse(vKey, `${v.chapter}:${v.verse}`); }}>
                                {supNum(fnCount)}
                              </span>
                            )}
                          </p>
                        </div>
                      );
                    });
                  })()}
                </div>
              ) : (
                <div className="loading-text" style={{padding:"40px 18px"}}>Passage text unavailable. <a href={`https://www.biblegateway.com/passage/?search=${encodeURIComponent(readings[activeTab])}&version=KJV`} target="_blank" rel="noreferrer" style={{color:"#8b6914"}}>BibleGateway ↗</a></div>
              )}
            </div>
          </div>

          {/* PARALLEL NOTES COLUMN — wide screens only */}
          {isWide && (() => {
            const anchoredNotes = comments.filter(c => c.verse_ref);
            return (
              <div className="wide-notes-col">
                <div style={{position:"relative", minHeight:"100%", paddingBottom:"80px"}}>
                  {!user && (
                    <div className="wide-notes-signin">
                      <button onClick={() => setShowAuth(true)}>Sign in</button> to add verse notes.
                    </div>
                  )}
                  {user && anchoredNotes.length === 0 && !panelAnchor && (
                    <div className="wide-notes-empty">Tap a verse number to add a note.</div>
                  )}
                  {anchoredNotes.map(c => {
                    const offset = verseOffsets[c.verse_ref] ?? 8;
                    return (
                      <div key={c.id} className="wide-note-card" style={{marginTop: offset > 8 ? offset : 8}}>
                        <div className="wide-note-verse-ref">{c.anchor_text || c.verse_ref}</div>
                        <div className="wide-note-body">{c.text}</div>
                        <div className="wide-note-author">{c.username} · {new Date(c.created_at).toLocaleDateString("en-US",{month:"short",day:"numeric"})}</div>
                      </div>
                    );
                  })}
                  {user && panelAnchor && (() => {
                    const offset = verseOffsets[panelAnchor.verseKey] ?? 8;
                    return (
                      <div className="wide-note-form" style={{marginTop: offset > 8 ? offset : 8}}>
                        <div className="wide-note-verse-ref">Note on {panelAnchor.text}</div>
                        <textarea placeholder="Add a note on this verse…" value={commentText}
                          onChange={e => setCommentText(e.target.value)} autoFocus />
                        <div className="wide-note-form-actions">
                          <button className="wide-note-submit" disabled={!commentText.trim()||submitting} onClick={handlePostComment}>
                            {submitting ? "Saving…" : "Save"}
                          </button>
                          <button className="wide-note-cancel" onClick={() => { setPanelAnchor(null); setCommentText(""); }}>Cancel</button>
                          {userGroups.filter(m=>m.status==="approved").length > 0 && (
                            <div style={{marginLeft:"auto",display:"flex",gap:"4px"}}>
                              <button className={`wide-toggle-btn${postVisibility==="personal"?" active":""}`}
                                onClick={() => setPostVisibility("personal")}>🔒</button>
                              <button className={`wide-toggle-btn${postVisibility==="group"?" active":""}`}
                                onClick={() => setPostVisibility("group")}>👥</button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>
            );
          })()}
          </div>{/* end wide-body */}
          </div>{/* end wide-wrapper */}
          );
        })()}
      </>) : (
        <div className="no-readings">No reading scheduled for this date.</div>
      )}

      {/* PROFILE / GROUPS TAB */}
      {activeTab === readings.length + 2 && (
        <div className="passage-scroll">
          <div className="profile-page">
            {!user ? (
              <div style={{textAlign:"center",padding:"40px 0"}}>
                <div style={{fontFamily:"'EB Garamond',serif",fontSize:"18px",color:"var(--ink)",marginBottom:"12px"}}>Sign in to manage groups</div>
                <button className="profile-action-btn primary" style={{maxWidth:"240px",margin:"0 auto"}} onClick={() => setShowAuth(true)}>Sign In</button>
              </div>
            ) : profileView === "main" ? (<>
              {/* User card */}
              <div className="profile-user-card">
                <div className="profile-avatar">{(user.user_metadata?.username || user.email)[0].toUpperCase()}</div>
                <div>
                  <div className="profile-email">{user.user_metadata?.username || user.email.split("@")[0]}</div>
                  <div className="profile-sub">{user.email}</div>
                </div>
              </div>

              {/* Groups list */}
              <div className="profile-section">
                <div className="profile-section-title">Your Groups</div>
                {groupsLoading && <div className="loading-text">Loading…</div>}
                {!groupsLoading && userGroups.length === 0 && (
                  <div style={{fontFamily:"'EB Garamond',serif",fontStyle:"italic",color:"var(--ink-light)",fontSize:"15px",marginBottom:"12px"}}>
                    You're not in any groups yet.
                  </div>
                )}
                {userGroups.map(m => (
                  <div key={m.id} className="group-card">
                    <div className="group-card-header">
                      <div className="group-name">{m.groups?.name}</div>
                      <span className={`group-role-badge ${m.status==="pending"?"pending":m.role}`}>
                        {m.status==="pending" ? "Pending" : m.role}
                      </span>
                    </div>
                    {m.status==="approved" && m.role==="admin" && (
                      <>
                        <div className="group-invite-label">Invite Code</div>
                        <div className="group-invite-row">
                          <div className="group-invite-code">{m.groups?.invite_code}</div>
                          <button className="group-btn secondary" onClick={() => { try{navigator.clipboard.writeText(m.groups?.invite_code);}catch(e){} showToast("Code copied!"); }}>Copy</button>
                        </div>
                      </>
                    )}
                    <div className="group-action-row">
                      {m.status==="approved" && m.role==="admin" && (
                        <button className="group-btn primary" onClick={() => {
                          setManageGroupId(m.group_id);
                          loadPendingRequests(m.group_id);
                          loadGroupMembers(m.group_id);
                          setProfileView("manage");
                        }}>Manage</button>
                      )}
                      {m.status==="approved" && m.role==="member" && (
                        <button className="group-btn danger" onClick={() => handleLeaveGroup(m.group_id)}>Leave</button>
                      )}
                      {m.status==="pending" && (
                        <button className="group-btn danger" onClick={() => handleLeaveGroup(m.group_id)}>Cancel Request</button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Actions */}
              <div className="profile-section">
                <div className="profile-section-title">Join or Create</div>
                <button className="profile-action-btn gold" onClick={() => { setProfileView("create"); setGroupActionError(""); }}>+ Create a Group</button>
                <button className="profile-action-btn primary" onClick={() => { setProfileView("join"); setGroupActionError(""); }}>Enter Invite Code</button>
              </div>

              {/* Sign out */}
              <div className="profile-section">
                <button className="profile-action-btn danger" onClick={() => supabase.auth.signOut()}>Sign Out</button>
              </div>
            </>) : profileView === "create" ? (<>
              <button onClick={() => setProfileView("main")} style={{background:"none",border:"none",color:"var(--gold)",fontFamily:"'Lato',sans-serif",fontSize:"13px",cursor:"pointer",marginBottom:"16px",padding:0}}>← Back</button>
              <div className="profile-section-title">Create a Group</div>
              <input className="profile-input" placeholder="Group name (e.g. Morning Study)"
                value={newGroupName} onChange={e => setNewGroupName(e.target.value)}
                onKeyDown={e => e.key==="Enter" && handleCreateGroup()} />
              {groupActionError && <div style={{color:"var(--red)",fontFamily:"'Lato',sans-serif",fontSize:"12px",marginBottom:"8px"}}>{groupActionError}</div>}
              <button className="profile-action-btn gold" disabled={!newGroupName.trim()||groupActionLoading} onClick={handleCreateGroup}>
                {groupActionLoading ? "Creating…" : "Create Group"}
              </button>
            </>) : profileView === "join" ? (<>
              <button onClick={() => setProfileView("main")} style={{background:"none",border:"none",color:"var(--gold)",fontFamily:"'Lato',sans-serif",fontSize:"13px",cursor:"pointer",marginBottom:"16px",padding:0}}>← Back</button>
              <div className="profile-section-title">Join a Group</div>
              <input className="profile-input" placeholder="Enter 6-character invite code"
                value={joinCode} onChange={e => setJoinCode(e.target.value.toUpperCase())}
                onKeyDown={e => e.key==="Enter" && handleJoinGroup()}
                style={{letterSpacing:"3px",fontWeight:"700",textTransform:"uppercase"}} />
              {groupActionError && <div style={{color:"var(--red)",fontFamily:"'Lato',sans-serif",fontSize:"12px",marginBottom:"8px"}}>{groupActionError}</div>}
              <button className="profile-action-btn gold" disabled={!joinCode.trim()||groupActionLoading} onClick={handleJoinGroup}>
                {groupActionLoading ? "Sending…" : "Send Join Request"}
              </button>
            </>) : profileView === "manage" && manageGroupId ? (() => {
              const membership = userGroups.find(m => m.group_id === manageGroupId);
              const pending = pendingRequests[manageGroupId] || [];
              const members = groupMembers[manageGroupId] || [];
              return (<>
                <button onClick={() => setProfileView("main")} style={{background:"none",border:"none",color:"var(--gold)",fontFamily:"'Lato',sans-serif",fontSize:"13px",cursor:"pointer",marginBottom:"16px",padding:0}}>← Back</button>
                <div className="group-name" style={{marginBottom:"16px"}}>{membership?.groups?.name}</div>

                {pending.length > 0 && (
                  <div className="profile-section">
                    <div className="profile-section-title">Pending Requests ({pending.length})</div>
                    <div className="group-card">
                      {pending.map(p => (
                        <div key={p.id} className="pending-member-row">
                          <div className="pending-member-email">{p.username || p.email}</div>
                          <div className="pending-actions">
                            <button className="approve-btn" onClick={() => handleApproveMember(manageGroupId, p.id)}>✓</button>
                            <button className="reject-btn" onClick={() => handleRejectMember(manageGroupId, p.id)}>✗</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="profile-section">
                  <div className="profile-section-title">Members ({members.length})</div>
                  <div className="group-card">
                    {members.map(m => (
                      <div key={m.id} className="member-list-row">
                        <div>
                          <div className="member-name">{m.username || m.email}</div>
                          <div className="member-role">{m.role}</div>
                        </div>
                        {m.user_id !== user.id && (
                          <button className="reject-btn" onClick={() => handleRemoveMember(manageGroupId, m.id)}>Remove</button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="profile-section">
                  <div className="profile-section-title">Danger Zone</div>
                  <button className="profile-action-btn danger" onClick={() => { if(window.confirm("Delete this group? This cannot be undone.")) handleDeleteGroup(manageGroupId); }}>
                    Delete Group
                  </button>
                </div>
              </>);
            })() : null}
          </div>
        </div>
      )}

      {/* BIBLE BROWSER TAB */}
      {activeTab === readings.length + 1 && (
        <div className="bible-browser">
          {/* Book + Chapter nav */}
          <div className="bible-nav">
            <select className="bible-select" value={browserBook}
              onChange={e => { setBrowserBook(e.target.value); setBrowserChapter(1); setBrowserChapterInput("1"); setSearchQuery(""); setGlobalSearch(false); setGlobalResults([]); }}>
              {BIBLE_BOOKS.map(b => <option key={b} value={b}>{b}</option>)}
            </select>
            <div className="bible-chapter-nav">
              <button className="bible-ch-btn" onClick={() => navigateChapter(-1)}
                disabled={browserChapter <= 1}>‹</button>
              <input className="bible-ch-input"
                type="number" min="1" max={CHAPTER_COUNTS[browserBook] || 1}
                value={browserChapterInput}
                onChange={e => handleChapterInputChange(e.target.value)}
                onFocus={e => e.target.select()}
                title="Type a chapter number" />
              <select className="bible-ch-select" value={browserChapter}
                onChange={e => handleChapterSelectChange(e.target.value)}
                title="Select a chapter">
                {Array.from({length: CHAPTER_COUNTS[browserBook] || 1}, (_,i) =>
                  <option key={i+1} value={i+1}>Ch {i+1}</option>
                )}
              </select>
              <button className="bible-ch-btn" onClick={() => navigateChapter(1)}
                disabled={browserChapter >= (CHAPTER_COUNTS[browserBook] || 1)}>›</button>
            </div>
          </div>

          {/* Search bar */}
          <div className="bible-search-bar">
            <input className="bible-search-input"
              placeholder={globalSearch ? "Search entire Bible…" : "Search this chapter…"}
              value={searchQuery}
              onChange={e => {
                setSearchQuery(e.target.value);
                if (!e.target.value.trim()) { setSearchMatches(new Set()); setGlobalResults([]); }
              }}
              onKeyDown={e => e.key === "Enter" && handleBrowserSearch()} />
            <button className="bible-search-btn" onClick={handleBrowserSearch}>Search</button>
            <label className="search-scope-toggle">
              <input type="checkbox" checked={globalSearch}
                onChange={e => { setGlobalSearch(e.target.checked); setSearchMatches(new Set()); setGlobalResults([]); }} />
              All Bible
            </label>
          </div>

          {/* Verse display — global search results OR chapter view */}
          {globalSearch && (globalResults.length > 0 || globalSearching) ? (
            <div className="passage-scroll" style={{ paddingBottom: panelOpen ? `${panelHeight+5}vh` : "0" }}>
              {globalSearching ? (
                <div className="loading-text">Searching the Bible…</div>
              ) : (
                <>
                  <div className="search-results-label" style={{padding:"10px 16px 4px"}}>
                    {globalResults.length} result{globalResults.length!==1?"s":""} for "{globalQuery}"
                    {globalResults.length===200 && " (showing first 200)"}
                  </div>
                  <div className="global-results">
                    {globalResults.map((v, i) => {
                      const escaped = globalQuery.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&'); const re = new RegExp('(' + escaped + ')', 'gi');
                      const highlighted = v.text.replace(re, '<mark>$1</mark>');
                      return (
                        <div key={i} className="global-result-card"
                          onClick={() => {
                            setBrowserBook(v.book); setBrowserChapter(v.chapter);
                            setBrowserChapterInput(String(v.chapter));
                            setGlobalSearch(false); setSearchQuery(""); setGlobalResults([]);
                            setSearchMatches(new Set([`${v.chapter}-${v.verse}`]));
                          }}>
                          <div className="global-result-ref">{v.book} {v.chapter}:{v.verse}</div>
                          <div className="global-result-text"
                            dangerouslySetInnerHTML={{__html: highlighted}} />
                        </div>
                      );
                    })}
                    {globalResults.length === 0 && !globalSearching && (
                      <div className="no-results">No results found for "{globalQuery}"</div>
                    )}
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="passage-scroll" style={{ paddingBottom: panelOpen ? `${panelHeight+5}vh` : "0" }}>
              <div className="passage-container" style={{"--reading-size": fontSize+"px"}}>
                <div className="passage-title">{browserBook} {browserChapter}</div>
                {searchMatches.size > 0 && (
                  <div className="search-results-label">{searchMatches.size} match{searchMatches.size!==1?"es":""} for "{globalQuery}"</div>
                )}
                {browserLoading ? (
                  <div className="loading-text">Loading…</div>
                ) : browserVerses.length > 0 ? (
                  <div className="passage-text">
                    {browserVerses.map((v, i) => {
                      const vKey = `${browserBook}-${v.chapter}-${v.verse}`;
                      const anns = browserAnnotations[vKey] || [];
                      const fnCount = browserComments.filter(c => c.verse_ref === vKey).length;
                      const isMatch = searchMatches.has(`${v.chapter}-${v.verse}`);
                      return (
                        <p key={i} className={`verse${isMatch?" search-match":""}`}
                          onMouseUp={e => handleBrowserVerseMouseUp(e, {...v, book:browserBook})}
                          onTouchEnd={e => handleBrowserVerseMouseUp(e, {...v, book:browserBook})}>
                          <span className="verse-num">{v.chapter}:{v.verse}</span>
                          <span className="verse-body"><AnnotatedVerse text={v.text} annotations={anns} /></span>
                          {fnCount > 0 && (
                            <span className="verse-footnote"
                              onClick={e => { e.stopPropagation();
                                setPanelAnchor({ verseKey: vKey, text: `${browserBook} ${v.chapter}:${v.verse}` });
                                setPanelOpen(true); }}>
                              {supNum(fnCount)}
                            </span>
                          )}
                        </p>
                      );
                    })}
                  </div>
                ) : (
                  <div className="loading-text">No verses found.</div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* SELECTION TOOLBAR */}
      {selToolbar && (
        <>
        <div style={{position:"fixed",inset:0,zIndex:499}} onClick={dismissToolbar} />
        <div className="sel-toolbar" style={{ left: selToolbar.x, top: Math.max(8, selToolbar.y) }}
          onClick={e => e.stopPropagation()}>
          {HIGHLIGHT_COLOURS.map(c => (
            <div key={c.name} className="sel-swatch" style={{ background: c.bg, borderColor: c.border }}
              title={c.name} onClick={() => applyAnnotation(c.bg, "highlight")} />
          ))}
          <div className="sel-swatch underline" title="Underline"
            onClick={() => { setPendingSel(selToolbar); setPickerMode("underline"); setShowColourPicker(true); setSelToolbar(null); }}>U</div>
          <div className="sel-custom" title="Custom colour"
            onClick={() => { setPendingSel(selToolbar); setPickerMode("highlight"); setShowColourPicker(true); setSelToolbar(null); }} />
          <div className="sel-divider" />
          <button className="sel-comment-btn" onClick={openCommentFromSel}>+ Note</button>
        </div>
        </>
      )}

      {/* COLOUR PICKER */}
      {showColourPicker && (
        <div className="colour-picker-overlay" onClick={() => setShowColourPicker(false)}>
          <div className="colour-picker-card" onClick={e => e.stopPropagation()}>
            <div className="colour-picker-title">{pickerMode === "underline" ? "Underline colour" : "Custom highlight"}</div>
            <div className="colour-grid">
              {HIGHLIGHT_COLOURS.map(c => (
                <div key={c.name} className="colour-cell" style={{ background: c.bg, borderColor: pickerColour===c.bg?"var(--ink)":"transparent" }}
                  onClick={() => setPickerColour(c.bg)} />
              ))}
            </div>
            <div className="custom-colour-row">
              <input type="color" className="custom-colour-input" value={pickerColour}
                onChange={e => setPickerColour(e.target.value)} />
              <span className="custom-colour-label">Or pick any colour</span>
            </div>
            <div className="picker-actions">
              <button className="picker-btn secondary" onClick={() => setShowColourPicker(false)}>Cancel</button>
              <button className="picker-btn primary" onClick={() => {
                if (pendingSel) {
                  const prev = selToolbar;
                  setSelToolbar(pendingSel);
                  applyAnnotation(pickerColour, pickerMode).then(() => { setPendingSel(null); });
                  setSelToolbar(null);
                }
                setShowColourPicker(false);
              }}>Apply</button>
            </div>
          </div>
        </div>
      )}

      {/* BOTTOM PANEL */}
      {panelOpen && (
        <>
          <div className="panel-backdrop" onClick={() => setPanelOpen(false)} />
          <div className="bottom-panel" style={{ height: `${panelHeight}vh` }}>
            <div className="panel-drag-handle" ref={dragRef}
              onMouseDown={onDragStart} onTouchStart={onDragStart} />
            <div className="panel-header">
              <div className="panel-title">
                {panelAnchor ? "Note" : "Discussion"}
                <span className="panel-count">{comments.length}</span>
              </div>
              <button className="panel-close" onClick={() => setPanelOpen(false)}>×</button>
            </div>
            {panelAnchor && (
              <div className="panel-anchor-label">
                📍 {panelAnchor.text.length > 60 ? panelAnchor.text.slice(0,60)+"…" : panelAnchor.text}
              </div>
            )}
            {/* VIEW TOGGLE — private vs public */}
            {user && (
              <div className="comment-view-toggle">
                <button className={`cv-btn${commentView==="personal"?" active":""}`}
                  onClick={() => setCommentView("personal")}>🔒 Private</button>
                {userGroups.filter(m=>m.status==="approved").length > 0 && (
                  <button className={`cv-btn${commentView==="group"?" active":""}`}
                    onClick={() => setCommentView("group")}>👥 Public</button>
                )}
              </div>
            )}
            {commentView==="group" && userGroups.filter(m=>m.status==="approved").length > 1 && (
              <select className="group-select" value={selectedGroupId||""}
                onChange={e => setSelectedGroupId(e.target.value)}>
                {userGroups.filter(m=>m.status==="approved").map(m => (
                  <option key={m.group_id} value={m.group_id}>{m.groups?.name}</option>
                ))}
              </select>
            )}
            <div className="panel-scroll">
              {!user && <p className="sign-in-prompt"><button className="sign-in-prompt-btn" onClick={()=>setShowAuth(true)}>Sign in</button> to add notes.</p>}
              {user && comments.length === 0 && <div className="no-comments">No {commentView==="group"?"public ":"private "}notes yet.</div>}
              {comments.map(c => (
                <div key={c.id} className="comment-card">
                  <div className="comment-header">
                    <span className="comment-author">
                      {c.username}
                      <span className={`comment-badge ${c.visibility||"personal"}`}>
                        {c.visibility==="group" ? "👥" : "🔒"}
                      </span>
                    </span>
                    <span className="comment-time">{new Date(c.created_at).toLocaleDateString("en-US",{month:"short",day:"numeric",hour:"2-digit",minute:"2-digit"})}</span>
                  </div>
                  {c.anchor_text && <div className="comment-anchor">"{c.anchor_text.length > 50 ? c.anchor_text.slice(0,50)+"…" : c.anchor_text}"</div>}
                  <div className="comment-body">{c.text}</div>
                </div>
              ))}
              {user && (
                <div className="comment-form">
                  {/* POST VISIBILITY */}
                  <div className="post-visibility">
                    <button className={`pv-btn${postVisibility==="personal"?" active":""}`}
                      onClick={() => setPostVisibility("personal")}>🔒 Private</button>
                    {userGroups.filter(m=>m.status==="approved").length > 0 && (
                      <button className={`pv-btn${postVisibility==="group"?" active":""}`}
                        onClick={() => setPostVisibility("group")}>👥 Public</button>
                    )}
                  </div>
                  {postVisibility==="group" && userGroups.filter(m=>m.status==="approved").length > 1 && (
                    <select className="pv-group-select" value={postGroupId||""}
                      onChange={e => setPostGroupId(e.target.value)}>
                      {userGroups.filter(m=>m.status==="approved").map(m => (
                        <option key={m.group_id} value={m.group_id}>{m.groups?.name}</option>
                      ))}
                    </select>
                  )}
                  {postVisibility==="group" && userGroups.filter(m=>m.status==="approved").length === 0 && (
                    <div style={{fontSize:"12px",color:"var(--ink-light)",fontFamily:"'Lato',sans-serif",marginBottom:"6px"}}>
                      You're not in any groups yet. <button style={{background:"none",border:"none",color:"var(--gold)",cursor:"pointer",fontSize:"12px"}} onClick={() => { setActiveTab(readings.length+2); setPanelOpen(false); }}>Join one →</button>
                    </div>
                  )}
                  <textarea className="comment-textarea"
                    placeholder={panelAnchor ? "Add a note on this verse…" : "Share a reflection…"}
                    value={commentText} onChange={e => setCommentText(e.target.value)} />
                  <button className="comment-submit" disabled={!commentText.trim()||submitting} onClick={handlePostComment}>
                    {submitting ? "Posting…" : "Post"}
                  </button>
                </div>
              )}
            </div>
          </div>
        </>
      )}

{/* AUTH */}
      {showAuth && (
        <div className="auth-overlay" onClick={e => { if(e.target===e.currentTarget) setShowAuth(false); }}>
          <div className="auth-card">
            <button className="auth-close" onClick={() => setShowAuth(false)}>x</button>
            <div className="auth-title">{authMode==="login"?"Welcome back":"Create account"}</div>
            <div className="auth-subtitle">{authMode==="login"?"Sign in to highlight and add notes":"Join the daily reading community"}</div>
            {authError && <div className="auth-error">{authError}</div>}
            <input className="auth-input" type="email" placeholder="Email address" value={authEmail} onChange={e => setAuthEmail(e.target.value)} />
            <input className="auth-input" type="password" placeholder="Password" value={authPassword} onChange={e => setAuthPassword(e.target.value)} onKeyDown={e => e.key==="Enter"&&handleAuth()} />
            <button className="auth-btn" disabled={authLoading||!authEmail||!authPassword} onClick={handleAuth}>
              {authLoading?"Please wait...":authMode==="login"?"Sign In":"Create Account"}
            </button>
            <div className="auth-switch">
              {authMode==="login"?"Don't have an account? ":"Already have an account? "}
              <button className="auth-switch-btn" onClick={() => { setAuthMode(authMode==="login"?"signup":"login"); setAuthError(""); }}>
                {authMode==="login"?"Sign up":"Sign in"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TOAST */}
      {toast && <div className="toast">{toast}</div>}

      {/* SETTINGS MENU */}
      {showSettings && (
        <div style={{position:"fixed",top:"52px",right:"calc(50% - 240px)",background:"var(--parchment)",
          border:"1px solid var(--border)",borderRadius:"0 0 0 8px",zIndex:300,
          padding:"12px",minWidth:"200px",boxShadow:"0 4px 12px rgba(0,0,0,0.15)"}}>
          <div style={{display:"flex",flexDirection:"column",gap:"10px"}}>
            <button style={{background:"none",border:"none",cursor:"pointer",
              color:"var(--ink)",fontFamily:"Lato",fontSize:"14px",textAlign:"left",padding:"4px 0"}}
              onClick={() => { toggleDark(); setShowSettings(false); }}>
              {darkMode ? "Light Mode" : "Dark Mode"}
            </button>
            <div style={{display:"flex",alignItems:"center",gap:"8px",color:"var(--ink)",fontSize:"14px",fontFamily:"Lato"}}>
              <span>Font</span>
              <button className="font-size-btn" onClick={() => setFontSize(p => Math.max(MIN_FONT, p-2))} disabled={fontSize<=MIN_FONT}>A-</button>
              <button className="font-size-btn" onClick={() => setFontSize(p => Math.min(MAX_FONT, p+2))} disabled={fontSize>=MAX_FONT}>A+</button>
            </div>
            <button style={{background:"none",border:"none",cursor:"pointer",
              color:"var(--ink)",fontFamily:"Lato",fontSize:"14px",textAlign:"left",padding:"4px 0"}}
              onClick={() => { handleShare(); setShowSettings(false); }}>
              Share
            </button>
            {user
              ? <button style={{background:"none",border:"none",cursor:"pointer",
                  color:"var(--ink)",fontFamily:"Lato",fontSize:"14px",textAlign:"left",padding:"4px 0"}}
                  onClick={() => { supabase.auth.signOut(); setShowSettings(false); }}>
                  Sign Out
                </button>
              : <button style={{background:"none",border:"none",cursor:"pointer",
                  color:"var(--ink)",fontFamily:"Lato",fontSize:"14px",textAlign:"left",padding:"4px 0"}}
                  onClick={() => { setShowAuth(true); setShowSettings(false); }}>
                  Sign In
                </button>
            }
            <button style={{background:"none",border:"none",cursor:"pointer",
              color:"var(--ink-light)",fontFamily:"Lato",fontSize:"12px",textAlign:"left",padding:"4px 0"}}
              onClick={() => setShowSettings(false)}>
              Close
            </button>
          </div>
        </div>
      )}

      {/* VERSION PICKER */}
      {showVersionPicker && (
        <div style={{position:"fixed",top:"52px",left:"calc(50% - 240px)",background:"var(--parchment)",
          border:"1px solid var(--border)",borderRadius:"0 0 8px 0",zIndex:300,
          padding:"12px",minWidth:"140px",boxShadow:"0 4px 12px rgba(0,0,0,0.15)"}}>
          <div style={{display:"flex",flexDirection:"column",gap:"8px"}}>
            {VERSIONS.map(v => (
              <button key={v}
                style={{background:bibleVersion===v?"var(--accent)":"none",
                  border:"1px solid var(--border)",borderRadius:"5px",cursor:"pointer",
                  color:"var(--ink)",fontFamily:"Lato",fontSize:"14px",
                  fontWeight:"700",padding:"6px 12px"}}
                onClick={() => { switchVersion(v); setShowVersionPicker(false); }}>
                {v}
              </button>
            ))}
            <button style={{background:"none",border:"none",cursor:"pointer",
              color:"var(--ink-light)",fontFamily:"Lato",fontSize:"12px",padding:"4px 0"}}
              onClick={() => setShowVersionPicker(false)}>
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}