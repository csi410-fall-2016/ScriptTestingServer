/* Query 13 */

SELECT *
FROM Department
WHERE ddept IN
    (SELECT cdept FROM Course);
