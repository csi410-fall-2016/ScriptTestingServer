/* Query 26 */
/* Find all the subordinates who make more than their managers. */

SELECT *
FROM Faculty  Sub, Faculty  Mgr
WHERE (Sub.fmgr_id = Mgr.fid)
     AND (Sub.fsalary > Mgr.fsalary);
