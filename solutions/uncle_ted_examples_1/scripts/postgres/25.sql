/* Query 25.sql */
/* Join subordinates and managers… they both just happen to be in the same table: Faculty. */

SELECT *
FROM Faculty  Sub, Faculty  Mgr
WHERE Sub.fmgr_id = Mgr.fid;
