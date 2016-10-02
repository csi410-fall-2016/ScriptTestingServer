/* Query 11 */

SELECT *
FROM Department, Faculty, Section
WHERE (ddept=fdept) AND (fid = sid);
